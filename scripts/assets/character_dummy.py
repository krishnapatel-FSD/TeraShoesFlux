# A test dummy in Mixamo's format, so the A8 pipeline and the B5 hero character can be built and
# tested before the real Mixamo download exists. Run by `pnpm assets:character --dummy`:
#   blender -b --factory-startup -P scripts/assets/character_dummy.py -- <out dir>
# Writes what Mixamo gives you: character.fbx (with skin, T-pose), idle.fbx and swing.fbx
# (without skin, animation only), using Mixamo's bone names ("mixamorig:Hips", …). The figure is
# simple blocks, each rigidly bound to its bone. It is our own work, so it can live in the repo.
import math
import sys

import bpy
from mathutils import Vector

out_dir = sys.argv[sys.argv.index("--") + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = 30

# Bone: (parent, head, tail) in metres, T-pose, facing -Y (Blender front).
BONES = {
    "Hips": (None, (0, 0, 0.95), (0, 0, 1.05)),
    "Spine": ("Hips", (0, 0, 1.05), (0, 0, 1.18)),
    "Spine1": ("Spine", (0, 0, 1.18), (0, 0, 1.3)),
    "Spine2": ("Spine1", (0, 0, 1.3), (0, 0, 1.42)),
    "Neck": ("Spine2", (0, 0, 1.42), (0, 0, 1.52)),
    "Head": ("Neck", (0, 0, 1.52), (0, 0, 1.72)),
    "LeftShoulder": ("Spine2", (0.04, 0, 1.4), (0.16, 0, 1.4)),
    "LeftArm": ("LeftShoulder", (0.16, 0, 1.4), (0.44, 0, 1.4)),
    "LeftForeArm": ("LeftArm", (0.44, 0, 1.4), (0.7, 0, 1.4)),
    "LeftHand": ("LeftForeArm", (0.7, 0, 1.4), (0.8, 0, 1.4)),
    "RightShoulder": ("Spine2", (-0.04, 0, 1.4), (-0.16, 0, 1.4)),
    "RightArm": ("RightShoulder", (-0.16, 0, 1.4), (-0.44, 0, 1.4)),
    "RightForeArm": ("RightArm", (-0.44, 0, 1.4), (-0.7, 0, 1.4)),
    "RightHand": ("RightForeArm", (-0.7, 0, 1.4), (-0.8, 0, 1.4)),
    "LeftUpLeg": ("Hips", (0.1, 0, 0.95), (0.1, 0, 0.52)),
    "LeftLeg": ("LeftUpLeg", (0.1, 0, 0.52), (0.1, 0, 0.1)),
    "LeftFoot": ("LeftLeg", (0.1, 0, 0.1), (0.1, -0.15, 0.02)),
    "RightUpLeg": ("Hips", (-0.1, 0, 0.95), (-0.1, 0, 0.52)),
    "RightLeg": ("RightUpLeg", (-0.1, 0, 0.52), (-0.1, 0, 0.1)),
    "RightFoot": ("RightLeg", (-0.1, 0, 0.1), (-0.1, -0.15, 0.02)),
}
# Block thickness per bone (the head is a cube, the rest boxes along the bone).
WIDTH = {"Hips": 0.32, "Spine": 0.3, "Spine1": 0.32, "Spine2": 0.36, "Head": 0.2, "Neck": 0.08}

arm_data = bpy.data.armatures.new("Armature")
rig = bpy.data.objects.new("Armature", arm_data)
scene.collection.objects.link(rig)
bpy.context.view_layer.objects.active = rig
bpy.ops.object.mode_set(mode="EDIT")
for name, (parent, head, tail) in BONES.items():
    eb = arm_data.edit_bones.new(f"mixamorig:{name}")
    eb.head, eb.tail = head, tail
    if parent:
        eb.parent = arm_data.edit_bones[f"mixamorig:{parent}"]
        eb.use_connect = False
bpy.ops.object.mode_set(mode="OBJECT")

# One box per bone, joined into a single skinned mesh.
mesh_parts = []
for name, (parent, head, tail) in BONES.items():
    h, t = Vector(head), Vector(tail)
    length = (t - h).length
    w = WIDTH.get(name, 0.09)
    bpy.ops.mesh.primitive_cube_add(size=1)
    box = bpy.context.active_object
    box.scale = (w, w * 0.8, length)
    box.location = (h + t) / 2
    box.rotation_mode = "QUATERNION"
    box.rotation_quaternion = (t - h).to_track_quat("Z", "Y")
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    box.vertex_groups.new(name=f"mixamorig:{name}").add(
        list(range(len(box.data.vertices))), 1.0, "REPLACE"
    )
    mesh_parts.append(box)
bpy.ops.object.select_all(action="DESELECT")
for p in mesh_parts:
    p.select_set(True)
bpy.context.view_layer.objects.active = mesh_parts[0]
bpy.ops.object.join()
body = bpy.context.active_object
body.name = "Body"
mat = bpy.data.materials.new("Skin")
mat.diffuse_color = (0.85, 0.78, 0.7, 1)
body.data.materials.append(mat)
body.parent = rig
body.modifiers.new("Armature", "ARMATURE").object = rig


def export(path, with_skin):
    bpy.ops.object.select_all(action="DESELECT")
    rig.select_set(True)
    if with_skin:
        body.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.export_scene.fbx(
        filepath=path,
        use_selection=True,
        object_types={"ARMATURE", "MESH"} if with_skin else {"ARMATURE"},
        # Like Mixamo, end every chain with an extra "_end" bone (the pipeline drops those).
        add_leaf_bones=True,
        bake_anim=not with_skin,
        bake_anim_use_all_actions=False,
        bake_anim_use_nla_strips=False,
    )


export(f"{out_dir}/character.fbx", True)

pb = rig.pose.bones
for b in pb:
    b.rotation_mode = "XYZ"


def key(frame, rotations):
    for bone, rot in rotations.items():
        pb[f"mixamorig:{bone}"].rotation_euler = rot
        pb[f"mixamorig:{bone}"].keyframe_insert("rotation_euler", frame=frame)


def make_action(name, frames, keys):
    rig.animation_data_create()
    rig.animation_data.action = bpy.data.actions.new(name)
    for frame, rotations in keys:
        key(frame, rotations)
    scene.frame_start, scene.frame_end = 1, frames


# Idle: arms down a little, a slow breath and sway, 2 s loop.
ARMS = {"LeftArm": (0, 0, -1.1), "RightArm": (0, 0, 1.1)}
make_action(
    "idle",
    60,
    [
        (1, {**ARMS, "Spine1": (0, 0, 0), "Head": (0, 0, 0)}),
        (30, {**ARMS, "Spine1": (0.06, 0, 0.04), "Head": (-0.05, 0, 0)}),
        (60, {**ARMS, "Spine1": (0, 0, 0), "Head": (0, 0, 0)}),
    ],
)
export(f"{out_dir}/idle.fbx", False)

# Swing: a forehand, the body turns and the right arm sweeps across, 1 s.
make_action(
    "swing",
    30,
    [
        (1, {**ARMS, "Spine1": (0, 0, 0), "RightArm": (0, 0, 1.1)}),
        (10, {**ARMS, "Spine1": (0, 0, 0.7), "RightArm": (0, -1.2, 0.2)}),
        (18, {**ARMS, "Spine1": (0, 0, -0.6), "RightArm": (0, 1.3, -0.1)}),
        (30, {**ARMS, "Spine1": (0, 0, 0), "RightArm": (0, 0, 1.1)}),
    ],
)
export(f"{out_dir}/swing.fbx", False)
print("DUMMY done", flush=True)
