# A6 reference render, run by `pnpm assets:lighting` inside Blender:
#   blender -b --factory-startup -P scripts/assets/lighting_reference.py -- <config.json>
#
# Renders the shoe with Cycles (path traced: real shadows, bounce light, sharp reflections) under
# the site's exact light rig, so the site's real-time render can be checked against it:
#   - environment: the site's studio environment, exported from three.js as an HDR, at the site's
#     envMapIntensity
#   - key, fill and rim directional lights, and the hemisphere light, at the site's strengths
#     (three.js lights in physical units map one to one onto Blender sun strength; the hemisphere
#     light becomes a sky-to-ground gradient of radiance intensity / π)
#   - the product photos' camera (30° vertical field of view, shoe 2 units long, fills 80%)
#   - three.js's ACES filmic tone mapping and exposure, applied to the linear render here
import json
import math
import sys

import bpy
import numpy as np
from mathutils import Vector

cfg = json.load(open(sys.argv[sys.argv.index("--") + 1]))

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = cfg["samples"]
scene.cycles.use_denoising = True
scene.render.film_transparent = True
scene.render.resolution_x = scene.render.resolution_y = cfg["size"]
scene.render.resolution_percentage = 100
scene.view_settings.view_transform = "Standard"  # tone mapped below, as three.js does
scene.render.image_settings.file_format = "OPEN_EXR"
scene.render.image_settings.color_depth = "32"


def b(v):
    """three.js / glTF (Y up) → Blender (Z up)."""
    return Vector((v[0], -v[2], v[1]))


# ---- The shoe, normalised like the site: 2 units long, centred ----
bpy.ops.import_scene.gltf(filepath=cfg["model"])
meshes = [o for o in scene.objects if o.type == "MESH"]
pivot = bpy.data.objects.new("pivot", None)
model = bpy.data.objects.new("model", None)
scene.collection.objects.link(pivot)
scene.collection.objects.link(model)
model.parent = pivot
for o in list(scene.objects):
    if o.parent is None and o not in (pivot, model):
        o.parent = model


def bbox():
    bpy.context.view_layer.update()
    pts = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return lo, hi


lo, hi = bbox()
k = 2 / (hi.x - lo.x)
model.scale = (k, k, k)
model.location = -(lo + hi) / 2 * k

# The base colour texture node(s), to swap per colourway.
colour_nodes = [
    n
    for m in bpy.data.materials
    if m.use_nodes
    for n in m.node_tree.nodes
    if n.type == "TEX_IMAGE" and n.image and "diffuse" in n.image.name.lower()
]
if not colour_nodes:
    raise SystemExit("No base colour texture found on the shoe")

# ---- Lights ----
world = bpy.data.worlds.new("studio")
scene.world = world
world.use_nodes = True
nt = world.node_tree
nt.nodes.clear()
out = nt.nodes.new("ShaderNodeOutputWorld")
env = nt.nodes.new("ShaderNodeTexEnvironment")
env.image = bpy.data.images.load(cfg["hdr"])
env_bg = nt.nodes.new("ShaderNodeBackground")
env_bg.inputs["Strength"].default_value = cfg["envMapIntensity"]
nt.links.new(env.outputs["Color"], env_bg.inputs["Color"])
# Hemisphere light: sky above, ground below, blended by the direction's height.
coord = nt.nodes.new("ShaderNodeTexCoord")
sep = nt.nodes.new("ShaderNodeSeparateXYZ")
nt.links.new(coord.outputs["Generated"], sep.inputs["Vector"])
height = nt.nodes.new("ShaderNodeMath")
height.operation = "MULTIPLY_ADD"
height.inputs[1].default_value = 0.5
height.inputs[2].default_value = 0.5
nt.links.new(sep.outputs["Z"], height.inputs[0])
mix = nt.nodes.new("ShaderNodeMix")
mix.data_type = "RGBA"
mix.inputs["A"].default_value = (*cfg["hemi"]["ground"], 1)
mix.inputs["B"].default_value = (*cfg["hemi"]["sky"], 1)
nt.links.new(height.outputs["Value"], mix.inputs["Factor"])
hemi_bg = nt.nodes.new("ShaderNodeBackground")
hemi_bg.inputs["Strength"].default_value = cfg["hemi"]["intensity"] / math.pi
nt.links.new(mix.outputs["Result"], hemi_bg.inputs["Color"])
add = nt.nodes.new("ShaderNodeAddShader")
nt.links.new(env_bg.outputs["Background"], add.inputs[0])
nt.links.new(hemi_bg.outputs["Background"], add.inputs[1])
nt.links.new(add.outputs["Shader"], out.inputs["Surface"])

suns = {}
for name, light in cfg["lights"].items():
    data = bpy.data.lights.new(name, type="SUN")
    data.energy = light["intensity"]
    data.color = light["colour"]
    data.angle = 0.0
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.rotation_euler = (-b(light["position"])).to_track_quat("-Z", "Y").to_euler()
    suns[name] = data

cam_data = bpy.data.cameras.new("camera")
cam_data.sensor_fit = "VERTICAL"
cam_data.angle = math.radians(30)
cam_data.clip_start = 0.1
cam_data.clip_end = 100
cam = bpy.data.objects.new("camera", cam_data)
scene.collection.objects.link(cam)
scene.camera = cam

# ---- three.js ACES filmic tone mapping (tonemapping_pars_fragment.glsl.js), then sRGB ----
ACES_IN = np.array(
    [[0.59719, 0.07600, 0.02840], [0.35458, 0.90834, 0.13383], [0.04823, 0.01566, 0.83777]]
)
ACES_OUT = np.array(
    [[1.60475, -0.10208, -0.00327], [-0.53108, 1.10813, -0.07276], [-0.07367, -0.00605, 1.07602]]
)


def tone_map(rgb):
    c = rgb * (cfg["exposure"] / 0.6)
    c = c @ ACES_IN
    a = c * (c + 0.0245786) - 0.000090537
    d = c * (0.983729 * c + 0.4329510) + 0.238081
    c = (a / d) @ ACES_OUT
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.0031308, 12.92 * c, 1.055 * np.power(c, 1 / 2.4) - 0.055)


images = {}
for shot in cfg["shots"]:
    tex = shot["texture"]
    if tex not in images:
        images[tex] = bpy.data.images.load(cfg["textures"] + "/" + tex)
    for n in colour_nodes:
        n.image = images[tex]
    suns["rim"].color = shot["rim"]

    # The view: rotate the shoe (the lights stay put, as on the site), centre it, frame it.
    rx, ry, rz = shot["rotation"]
    pivot.rotation_euler = (rx, -rz, ry)
    pivot.location = (0, 0, 0)
    lo, hi = bbox()
    pivot.location = -(lo + hi) / 2
    size = hi - lo
    dist = max(size.x, size.z) / 2 / 0.8 / math.tan(math.radians(15)) + size.y / 2
    cam.location = (0, -dist, 0)
    cam.rotation_euler = (math.radians(90), 0, 0)

    exr = f"{cfg['out']}/ref-{shot['name']}.exr"
    scene.render.filepath = exr
    bpy.ops.render.render(write_still=True)

    img = bpy.data.images.load(exr)
    w, h = img.size
    px = np.array(img.pixels[:], dtype=np.float32).reshape(h, w, 4)
    alpha = px[..., 3:4]
    straight = np.where(alpha > 1e-4, px[..., :3] / np.maximum(alpha, 1e-4), 0)
    rgba = np.concatenate([tone_map(straight), alpha], axis=2).astype(np.float32)
    png = bpy.data.images.new(f"ref-{shot['name']}", w, h, alpha=True)
    png.pixels[:] = rgba.ravel()
    png.filepath_raw = f"{cfg['out']}/ref-{shot['name']}.png"
    png.file_format = "PNG"
    png.save()
    bpy.data.images.remove(img)
    bpy.data.images.remove(png)
    print(f"REF {shot['name']} done", flush=True)
