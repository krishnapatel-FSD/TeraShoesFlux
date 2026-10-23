# A8: builds the hero athlete, a runner, from free, open assets. Run by `pnpm assets:character`:
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
from mathutils import Matrix, Vector

args = sys.argv[sys.argv.index("--") + 1 :]
ual_glb, out_glb = args[0], args[1]
preview_dir = args[2] if len(args) > 2 else None

# The look: a lean adult runner (the colours are set in build-character.mts). Asset names are matched
# by file name in MPFB's data.
BODY = {"gender": 1.0, "age": 0.5, "muscle": 0.7, "weight": 0.42, "height": 0.72, "proportions": 1.0}
# MakeHuman's macros alone leave a slight frame (narrow shoulders, soft chest, wide hips, a boyish
# face). These shape targets follow the reference runner the product owner chose (a 10 s clip,
# 23 Oct 2026): young and slim-athletic, moderate shoulders over a long torso and slim waist, a
# slender neck, lean toned arms and thighs, defined calves, a soft oval face. Target names are
# MPFB's (data/targets).
SHAPE = {
    # A clear V over a long torso: shoulders wider than the hips, a flat chest, not bulky.
    "torso-vshape-incr": 0.5,
    "measure-shoulder-dist-incr": 0.55,
    "measure-bust-circ-decr": 0.35,
    "torso-muscle-pectoral-incr": 0.15,
    "torso-muscle-dorsi-incr": 0.35,
    "torso-scale-vert-incr": 0.2,
    "measure-waist-circ-decr": 0.5,
    "measure-hips-circ-decr": 0.7,
    "stomach-pregnant-decr": 0.4,
    # A slender, slightly longer neck.
    "measure-neck-height-incr": 0.3,
    "measure-neck-circ-decr": 0.2,
    # Lean, toned arms and thighs; defined calves; a little more leg.
    **{f"{s}-upperarm-muscle-incr": 0.4 for s in "lr"},
    **{f"{s}-upperarm-shoulder-muscle-incr": 0.25 for s in "lr"},
    **{f"{s}-lowerarm-muscle-incr": 0.2 for s in "lr"},
    **{f"{s}-upperleg-muscle-incr": 0.25 for s in "lr"},
    **{f"{s}-lowerleg-muscle-incr": 0.45 for s in "lr"},
    **{f"{s}-upperleg-scale-vert-incr": 0.15 for s in "lr"},
    **{f"{s}-lowerleg-scale-vert-incr": 0.15 for s in "lr"},
    # A young, soft oval face.
    "head-oval": 0.4,
    "head-age-decr": 0.15,
    "chin-prominent-incr": 0.15,
}
SKIN = "young_caucasian_male"
EYES = "low-poly"
BODYPARTS = ["eyebrow001", "eyelashes01"]
HAIR = "short02"
CLOTHES = ["namuhekam_male_polo_shirt", "mindfront_male_swimming_trunks_01", "punkduck_running_shoes_01"]
# Library clip → site clip: standing at rest, jogging while the page scrolls, a sprint on a colour change.
CLIPS = {"Idle_Loop": "idle", "Jog_Fwd_Loop": "run", "Sprint_Loop": "swing"}

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
TargetService.bulk_load_targets(human, [{"target": t, "value": v} for t, v in SHAPE.items()])
# Baked into the mesh: left as shape keys, every slider would ship as a morph target the browser
# blends each frame (37 of them, a third of the file).
TargetService.bake_targets(human)
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
# The shorts' waistband would poke through the shirt as he moves: the part of the shorts hidden
# under the shirt (well above its hem) is cut away.
shirt = next(o for o in rig.children if CLOTHES[0] in o.name)
shorts = next(o for o in rig.children if CLOTHES[1] in o.name)
hem = min((shirt.matrix_world @ v.co).z for v in shirt.data.vertices)
mesh = bmesh.new()
mesh.from_mesh(shorts.data)
hidden = [v for v in mesh.verts if (shorts.matrix_world @ v.co).z > hem + 0.07]
bmesh.ops.delete(mesh, geom=hidden, context="VERTS")
mesh.to_mesh(shorts.data)
mesh.free()
# His shoulders and back would push past the shirt as he moves: it sits a few millimetres out.
push = shirt.modifiers.new("Over the muscles", "DISPLACE")
push.strength, push.mid_level = 0.004, 0
bpy.context.view_layer.objects.active = shirt
bpy.ops.object.modifier_move_to_index(modifier=push.name, index=0)

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
    # Each clip from the front three-quarter, the side and the back: the site turns him through 180°.
    for name in CLIPS.values():
        track = rig.animation_data.nla_tracks[name]
        track.mute = False
        end = track.strips[0].frame_end
        for a, turn in enumerate((0, 90, 180)):
            rig.rotation_euler.z = math.radians(turn)
            for i in range(2):
                scene.frame_set(int(end * i / 2))
                scene.render.filepath = f"{preview_dir}/{name}_{a}{i}.png"
                bpy.ops.render.render(write_still=True)
        rig.rotation_euler.z = 0
        track.mute = True

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
