"""Brown spray-paint version of the Koresh logo (from the black-on-transparent file), trimmed, with overspray speckle and drips."""
import sys, numpy as np, cv2
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
rng = np.random.default_rng(11)
a = np.array(Image.open(src).convert('RGBA'))[..., 3].astype(np.float32) / 255
ys, xs = np.where(a > .05); a = a[ys.min()-30:ys.max()+90, xs.min()-30:xs.max()+30]   # room for drips below
H, W = a.shape
core = (a > .5).astype(np.uint8)
# overspray: soft halo around the paint, broken into fine speckle
halo = cv2.GaussianBlur(cv2.dilate(core, np.ones((9, 9), np.uint8)).astype(np.float32), (0, 0), 6) * (1 - core)
speck = (rng.random((H, W)) < halo * .13).astype(np.float32)
speck = cv2.GaussianBlur(speck, (0, 0), .7) * 1.6
# drips: from random points on the bottom edge of the letters
drips = np.zeros((H, W), np.float32)
edge = (core == 1) & (np.roll(core, -3, 0) == 0)
cy, cx = np.where(edge)
for i in rng.choice(len(cy), 9, replace=False):
    x, y, L = int(cx[i]), int(cy[i]), int(rng.integers(26, 80))
    if y + L >= H - 2: continue
    wd = int(rng.integers(2, 4))
    for k in range(L):
        drips[y + k, max(0, x - wd // 2):x + wd] = max(drips[y + k, x], 1 - k / (L * 1.6))
    cv2.circle(drips, (x, y + L), wd, 1.0, -1)
drips = cv2.GaussianBlur(drips, (0, 0), .8)
# paint thickness variation: thin patches where the spray was light
grain = cv2.GaussianBlur(rng.random((H, W)).astype(np.float32), (0, 0), 2.2); grain = (grain - grain.min()) / (grain.max() - grain.min())
alpha = np.clip(np.maximum.reduce([a * (.82 + .18 * grain), speck, drips * .9]), 0, 1)
col = np.array([0x3b, 0x2a, 0x24], np.float32)
img = np.dstack([np.broadcast_to(col, (H, W, 3)), alpha * 255]).astype(np.uint8)
Image.fromarray(img).save(out + '.png')
Image.fromarray(img).save(out, quality=90, method=6)
print(W, H, round(W / H, 3))
