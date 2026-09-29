const cursor = document.getElementById('cursor');
const ring   = document.getElementById('cursor-ring');
let mx = 0, my = 0, rx = 0, ry = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cursor.style.transform = `translate(${mx - 6}px,${my - 6}px)`;
});

(function animRing() {
  rx += (mx - rx) * 0.15;
  ry += (my - ry) * 0.15;
  ring.style.transform = `translate(${rx - 18}px,${ry - 18}px)`;
  requestAnimationFrame(animRing);
})();