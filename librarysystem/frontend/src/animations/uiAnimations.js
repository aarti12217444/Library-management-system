import { animate, stagger } from "animejs";

export const animateEntry = (targets, options = {}) =>
  animate(targets, {
    opacity: [0, 1],
    translateY: [18, 0],
    duration: 800,
    ease: "outExpo",
    ...options,
  });

export const animateStaggerIn = (targets, options = {}) =>
  animate(targets, {
    opacity: [0, 1],
    translateY: [16, 0],
    duration: 700,
    delay: stagger(90),
    ease: "outExpo",
    ...options,
  });

export const attachButtonAnimations = (root) => {
  if (!root) return () => {};
  const buttons = Array.from(root.querySelectorAll("button"));
  const disposers = [];

  buttons.forEach((button) => {
    const onEnter = () => animate(button, { scale: 1.05, duration: 220, ease: "outExpo" });
    const onLeave = () => animate(button, { scale: 1, duration: 220, ease: "outExpo" });
    const onDown = () => animate(button, { scale: 0.97, duration: 120, ease: "outQuad" });
    const onUp = () => animate(button, { scale: 1.03, duration: 160, ease: "outExpo" });

    button.addEventListener("mouseenter", onEnter);
    button.addEventListener("mouseleave", onLeave);
    button.addEventListener("mousedown", onDown);
    button.addEventListener("mouseup", onUp);
    button.addEventListener("touchstart", onDown, { passive: true });
    button.addEventListener("touchend", onUp, { passive: true });

    disposers.push(() => {
      button.removeEventListener("mouseenter", onEnter);
      button.removeEventListener("mouseleave", onLeave);
      button.removeEventListener("mousedown", onDown);
      button.removeEventListener("mouseup", onUp);
      button.removeEventListener("touchstart", onDown);
      button.removeEventListener("touchend", onUp);
    });
  });

  return () => disposers.forEach((dispose) => dispose());
};

export const attachFormFocusAnimations = (root) => {
  if (!root) return () => {};
  const fields = Array.from(root.querySelectorAll("input, select, textarea"));
  const disposers = [];

  fields.forEach((field) => {
    const onFocus = () =>
      animate(field, {
        scale: [1, 1.01],
        boxShadow: ["0 0 0 rgba(99,102,241,0)", "0 0 0 6px rgba(99,102,241,0.16)"],
        duration: 230,
        ease: "outExpo",
      });
    const onBlur = () =>
      animate(field, {
        scale: 1,
        boxShadow: "0 0 0 rgba(99,102,241,0)",
        duration: 220,
        ease: "outExpo",
      });

    field.addEventListener("focus", onFocus);
    field.addEventListener("blur", onBlur);
    disposers.push(() => {
      field.removeEventListener("focus", onFocus);
      field.removeEventListener("blur", onBlur);
    });
  });

  return () => disposers.forEach((dispose) => dispose());
};

export const animateSuccess = (target) => {
  if (!target) return;
  animate(target, {
    scale: [0.95, 1.03, 1],
    opacity: [0, 1],
    duration: 520,
    ease: "outExpo",
  });
};
