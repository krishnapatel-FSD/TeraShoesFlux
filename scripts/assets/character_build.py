# A8: turns a Mixamo download into one GLB for the site. Run by `pnpm assets:character`:
#   blender -b --factory-startup -P scripts/assets/character_build.py -- <in dir> <out.glb>
# <in dir> holds what Mixamo gives you: character.fbx (with skin), idle.fbx and swing.fbx
# (without skin, same rig). Each animation's action is moved onto the character as an NLA track
# named after its file, and the glTF exporter writes one clip per track ("idle", "swing").
import sys

import bpy

args = sys.argv[sys.argv.index("--") + 1 :]
in_dir, out_glb = args[0], args[1]
CLIPS = ["idle", "swing"]

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = 30


def import_fbx(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.fbx(filepath=path, ignore_leaf_bones=True)
    return [o for o in bpy.data.objects if o not in before]


def armature_of(objects):
    rigs = [o for o in objects if o.type == "ARMATURE"]
    if len(rigs) != 1:
        raise SystemExit(f"Expected one armature, found {len(rigs)}")
    return rigs[0]


character = import_fbx(f"{in_dir}/character.fbx")
rig = armature_of(character)
if not any(o.type == "MESH" for o in character):
    raise SystemExit("character.fbx has no mesh: download it from Mixamo *with skin*")
rig.animation_data_create()
rig.animation_data.action = None

for clip in CLIPS:
    objs = import_fbx(f"{in_dir}/{clip}.fbx")
    src = armature_of(objs)
    action = src.animation_data.action if src.animation_data else None
    if action is None:
        raise SystemExit(f"{clip}.fbx has no animation")
    action.name = clip
    track = rig.animation_data.nla_tracks.new()
    track.name = clip
    strip = track.strips.new(clip, int(action.frame_range[0]), action)
    # Blender 4.4+ layered actions: point the strip at the action's only slot.
    if hasattr(strip, "action_slot") and getattr(action, "slots", None):
        strip.action_slot = action.slots[0]
    track.mute = True
    for o in objs:
        bpy.data.objects.remove(o, do_unlink=True)

bpy.ops.export_scene.gltf(
    filepath=out_glb,
    export_format="GLB",
    export_animations=True,
    export_animation_mode="NLA_TRACKS",
    export_skins=True,
    export_yup=True,
    export_image_format="AUTO",
)
print("CHARACTER done", flush=True)
