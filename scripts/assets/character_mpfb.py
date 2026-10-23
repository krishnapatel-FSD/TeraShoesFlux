# A8: builds the hero tennis player from free, open assets. Run by `pnpm assets:character`:
#   blender -b --factory-startup -P scripts/assets/character_mpfb.py -- <ual.glb> <out.glb> [preview dir]
# The body, skin, hair and clothes come from MakeHuman (the MPFB add-on and its asset packs, CC0 and
# CC-BY); the animations from Quaternius' Universal Animation Library (CC0). MPFB's "game engine" rig
# has the same bone names as the library's rig, but a different rest pose and different proportions,
# so each clip is retargeted: every bone copies the source bone's rotation away from its rest pose, in
# world space, and the pelvis copies its movement scaled to the new hip height.
import math
import os
import sys
from glob import glob

import addon_utils
import bmesh
import bpy
from mathutils import Matrix, Quaternion, Vector

args = sys.argv[sys.argv.index("--") + 1 :]
ual_glb, out_glb = args[0], args[1]
preview_dir = args[2] if len(args) > 2 else None

# The look: an athletic adult in a tennis kit. Asset names are matched by file name in MPFB's data.
BODY = {"gender": 1.0, "age": 0.5, "muscle": 0.68, "weight": 0.45, "height": 0.6, "proportions": 0.6}
SKIN = "young_caucasian_male"
EYES = "low-poly"
BODYPARTS = ["eyebrow001", "eyelashes01"]
HAIR = "short02"
CLOTHES = ["namuhekam_male_polo_shirt", "elvs_male_trouser_short_1", "punkduck_running_shoes_01"]
# Library clip → site clip. The sword stance and slash read as a ready position and a swing.
CLIPS = {"Sword_Idle": "idle", "Sword_Attack": "swing"}

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = 30
# Enabled for this run only: --factory-startup never saves preferences.
addon_utils.enable("bl_ext.blender_org.mpfb", default_set=True)
from bl_ext.blender_org.mpfb.services.exportservice import ExportService  # noqa: E402
from bl_ext.blender_org.mpfb.services.humanservice import HumanService  # noqa: E402
from bl_ext.blender_org.mpfb.services.locationservice import LocationService  # noqa: E402
from bl_ext.blender_org.mpfb.services.targetservice import TargetService  # noqa: E402

roots = [LocationService.get_user_data(), LocationService.get_mpfb_data()]


def find(sub, pattern, ext):
    for root in roots:
        hits = sorted(glob(os.path.join(root, sub, "**", pattern + ext), recursive=True))
        if hits:
            return hits[0]
    raise SystemExit(f"No {sub} matching {pattern}{ext}: is the asset pack installed?")


# --- the human -------------------------------------------------------------------------------
macro = TargetService.get_default_macro_info_dict()
macro.update(BODY)
human = HumanService.create_human(macro_detail_dict=macro)
rig = HumanService.add_builtin_rig(human, "game_engine")
HumanService.set_character_skin(find("skins", SKIN, ".mhmat"), human, skin_type="GAMEENGINE")
HumanService.add_mhclo_asset(find("eyes", EYES, ".mhclo"), human, asset_type="Eyes", subdiv_levels=0, material_type="GAMEENGINE")
for part in BODYPARTS:
    sub = "eyebrows" if part.startswith("eyebrow") else "eyelashes"
    HumanService.add_mhclo_asset(find(sub, part, ".mhclo"), human, asset_type=sub.capitalize(), subdiv_levels=0, material_type="GAMEENGINE")
HumanService.add_mhclo_asset(find("hair", HAIR, ".mhclo"), human, asset_type="Hair", subdiv_levels=0, material_type="GAMEENGINE")
# Hair materials are named after the style ("short02"): named as hair, they get the cut-out
# transparency below and in the site, instead of a solid black fringe.
for slot in next(o for o in human.parent.children if o.name.endswith(HAIR)).material_slots:
    slot.material.name = "Human.hair." + HAIR
for pattern in CLOTHES:
    HumanService.add_mhclo_asset(find("clothes", pattern, ".mhclo"), human, asset_type="Clothes", subdiv_levels=0, material_type="GAMEENGINE")
ExportService.bake_modifiers_remove_helpers(human, bake_masks=True)
# Untucked, the shorts' waistband pokes through the shirt's hem when he bends. The shirt is tucked
# in instead: everything more than a few centimetres below the waistband is cut away.
shirt = next(o for o in rig.children if CLOTHES[0] in o.name)
shorts = next(o for o in rig.children if CLOTHES[1] in o.name)
waist = max((shorts.matrix_world @ v.co).z for v in shorts.data.vertices)
mesh = bmesh.new()
mesh.from_mesh(shirt.data)
tucked = [v for v in mesh.verts if (shirt.matrix_world @ v.co).z < waist - 0.03]
bmesh.ops.delete(mesh, geom=tucked, context="VERTS")
mesh.to_mesh(shirt.data)
mesh.free()

# Configure materials: opaque for skin, clothes, eyes; alpha clip only for hair/brows/lashes.
for mat in bpy.data.materials:
    mname = mat.name.lower()
    if any(k in mname for k in ("hair", "eyebrow", "eyelash")):
        mat.blend_method = "CLIP"
        mat.alpha_threshold = 0.5
    else:
        mat.blend_method = "OPAQUE"
        if mat.use_nodes and mat.node_tree:
            for node in mat.node_tree.nodes:
                if node.type == "BSDF_PRINCIPLED":
                    for link in list(node.inputs["Alpha"].links):
                        mat.node_tree.links.remove(link)
                    node.inputs["Alpha"].default_value = 1.0
print("HUMAN", rig.name, len(rig.data.bones), [o.name for o in rig.children], flush=True)

# --- the racket, for the preview only ----------------------------------------------------------
# The site puts its own racket (racketKit: 2 units along +Y, strings in the XY plane, grip around
# y = -0.75) in the right hand, placed from the finger joints in heroCharacter.ts; this is the same
# placement, so the preview shows the swing with it. It isn't exported: the glTF exporter writes an
# object parented to a bone in a frame three.js reads differently.
RACKET_LENGTH = 0.685  # metres, a full-size racket
bones = rig.data.bones
hand = bones["hand_r"].head_local
fingers = (bones["middle_01_r"].head_local - hand).normalized()
across = bones["index_01_r"].head_local - bones["pinky_01_r"].head_local
across = (across - fingers * across.dot(fingers)).normalized()
palm = across.cross(fingers).normalized()
up = (across + fingers * 0.5).normalized()
side = up.cross(palm).normalized()
scale = RACKET_LENGTH / 2
grip = hand + fingers * (bones["middle_01_r"].head_local - hand).length * 0.55 + palm * 0.022
socket = bpy.data.objects.new("racket_socket", None)
scene.collection.objects.link(socket)
socket.parent, socket.parent_type, socket.parent_bone = rig, "BONE", "hand_r"
rig.data.pose_position = "REST"
bpy.context.view_layer.update()
basis = Matrix((side, up, palm)).transposed().to_4x4()
basis.translation = grip + up * 0.75 * scale
socket.matrix_world = rig.matrix_world @ basis @ Matrix.Scale(scale, 4)
rig.data.pose_position = "POSE"

# --- the animations --------------------------------------------------------------------------
before = set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=ual_glb)
library = [o for o in bpy.data.objects if o not in before]
src = next(o for o in library if o.type == "ARMATURE")
src_bones = {b.name.lower(): b.name for b in src.pose.bones}
pairs = [(pb, src.pose.bones[src_bones[pb.name.lower()]]) for pb in rig.pose.bones if pb.name.lower() in src_bones]


def depth(pb):
    return 0 if pb.parent is None else 1 + depth(pb.parent)


levels = {}
for d, s in pairs:
    levels.setdefault(depth(d), []).append((d, s))
for pb in rig.pose.bones:
    pb.rotation_mode = "QUATERNION"


def world_rest(obj, pb):
    return obj.matrix_world @ pb.bone.matrix_local


def bone_dir(m):
    return (m.to_3x3() @ Vector((0, 1, 0))).normalized()


# Calibration: the rotation that turns each of our bones from its rest direction to the library's.
calib = {}
for d, s in pairs:
    rd, rs = world_rest(rig, d), world_rest(src, s)
    calib[d.name] = (rs.to_quaternion(), bone_dir(rd).rotation_difference(bone_dir(rs)) @ rd.to_quaternion())
hips = lambda o, n: (world_rest(o, o.pose.bones[n]).translation.z)  # noqa: E731
stride = hips(rig, "pelvis") / hips(src, src_bones["pelvis"])

rig.animation_data_create()
for clip, name in CLIPS.items():
    act = bpy.data.actions[clip]
    src.animation_data.action = act
    if getattr(act, "slots", None):
        src.animation_data.action_slot = act.slots[0]
    out = bpy.data.actions.new(name)
    rig.animation_data.action = out
    f0, f1 = (int(round(f)) for f in act.frame_range)
    for f in range(f0, f1 + 1):
        scene.frame_set(f)
        for pb in rig.pose.bones:
            pb.matrix_basis = Matrix.Identity(4)
        bpy.context.view_layer.update()
        for lvl in sorted(levels):
            for d, s in levels[lvl]:
                rs0, rd0 = calib[d.name]
                ws = src.matrix_world @ s.matrix
                rot = ws.to_quaternion() @ rs0.inverted() @ rd0
                head = (rig.matrix_world @ d.matrix).translation
                if d.name == "pelvis":
                    moved = ws.translation - world_rest(src, s).translation
                    head = world_rest(rig, d).translation + moved * stride
                d.matrix = rig.matrix_world.inverted() @ Matrix.LocRotScale(head, rot, Vector((1, 1, 1)))
            bpy.context.view_layer.update()
        for d, _ in pairs:
            d.keyframe_insert("rotation_quaternion", frame=f - f0)
            if d.name == "pelvis":
                d.keyframe_insert("location", frame=f - f0)
    track = rig.animation_data.nla_tracks.new()
    track.name = name
    strip = track.strips.new(name, 0, out)
    if hasattr(strip, "action_slot") and getattr(out, "slots", None):
        strip.action_slot = out.slots[0]
    track.mute = True
    rig.animation_data.action = None
    print("CLIP", name, f1 - f0 + 1, "frames", flush=True)
for o in library:
    bpy.data.objects.remove(o, do_unlink=True)

# --- preview frames for approval ---------------------------------------------------------------
if preview_dir:
    preview_dir = os.path.abspath(preview_dir)
    os.makedirs(preview_dir, exist_ok=True)
    # A stand-in racket on the socket, in racketKit's units, only for the preview.
    stand_in = []
    for loc, size in (((0, -0.58, 0), (0.12, 0.76, 0.12)), ((0, 0.55, 0), (0.6, 0.84, 0.05))):
        bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
        part = bpy.context.object
        part.scale = size
        part.parent = socket
        part.matrix_parent_inverse = Matrix.Identity(4)
        stand_in.append(part)
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    scene.collection.objects.link(cam)
    scene.camera = cam
    cam.data.type = "ORTHO"
    cam.data.ortho_scale = 2.4
    cam.location = (2.0, -5.0, 1.0)
    cam.rotation_euler = (Vector((0, 0, 0.95)) - cam.location).to_track_quat("-Z", "Y").to_euler()
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
    sun.data.energy = 3.5
    sun.rotation_euler = (math.radians(50), 0, math.radians(30))
    scene.collection.objects.link(sun)
    world = bpy.data.worlds.new("w")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (0.85, 0.85, 0.85, 1)
    scene.world = world
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x, scene.render.resolution_y = 300, 400
    scene.view_settings.view_transform = "Standard"
    for track in rig.animation_data.nla_tracks:
        track.mute = True
    for name in CLIPS.values():
        track = rig.animation_data.nla_tracks[name]
        track.mute = False
        n = 6 if name == "swing" else 2
        end = track.strips[0].frame_end
        for i in range(n):
            scene.frame_set(int(end * i / n))
            scene.render.filepath = f"{preview_dir}/{name}_{i}.png"
            bpy.ops.render.render(write_still=True)
        track.mute = True
    for part in stand_in:
        bpy.data.objects.remove(part, do_unlink=True)
bpy.data.objects.remove(socket, do_unlink=True)

bpy.ops.export_scene.gltf(
    filepath=out_glb,
    export_format="GLB",
    export_animations=True,
    export_animation_mode="NLA_TRACKS",
    export_skins=True,
    export_yup=True,
    export_apply=True,
    export_image_format="AUTO",
)
print("CHARACTER done", flush=True)
