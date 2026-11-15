// Material Design Icons (filled, 24 × 24), as in the sibling cards.
export const ICONS = {
  clock:
    "M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.9L16.2,16.2Z",
  bars: "M22,21H2V3H4V19H6V10H10V19H12V6H16V19H18V14H22V21Z",
  curve: "M3,3H5V19H21V21H3V3M7,16C11,16 12,7 20,6V8C13.6,8.7 13,18 7,18V16Z",
  drop: "M12,20A6,6 0 0,1 6,14C6,10 12,3.25 12,3.25C12,3.25 18,10 18,14A6,6 0 0,1 12,20Z",
  alert: "M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z",
};

export const svgIcon = (name, cls = "icon") =>
  `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[name]}"></path></svg>`;
