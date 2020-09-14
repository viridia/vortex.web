import { darken, lighten, transparentize } from 'polished';

const shades = {
  coolGray: '#ccd',
  coolGray1: lighten(0.05, '#ccd'),
  coolGray2: '#99e',
  coolGray7: '#222',
};

export const colors = {
  ...shades,

  panelBg: shades.coolGray,
  graphBg: '#667',
  selectedBg: shades.coolGray2,

  listBg: shades.coolGray1,
  listBgHover: lighten(0.05, shades.coolGray1),
  listBgSelected: darken(0.1, shades.coolGray1),

  controlBorder: '#444',
  comboBg: darken(.08, shades.coolGray),

  terminalCaption: '#eee',

  connectorStroke: '#797',
  connectorOutlineStroke: '#000',
  connectorShadowStroke: '#000',
  connectorStrokeVector: '#4c4',

  headerBg: shades.coolGray7,
  headerColor: '#eee',

  modalBg: transparentize(.7, '#335'),
  modalText: '#000',
  modalDialogBg: shades.coolGray,
  modalBorder: '#000',
  modalShadow: transparentize(.3, '#000'),
  modalSepLight: lighten(.1, shades.coolGray),
  modalSepDark: darken(.1, shades.coolGray),

  buttonBg: `linear-gradient(to bottom, ${lighten(.01, shades.coolGray)}, ${darken(.09, shades.coolGray)})`,
  buttonActiveBg: `linear-gradient(to bottom, ${darken(.15, shades.coolGray)}, ${darken(.05, shades.coolGray)})`,
  buttonSelectedBg: `linear-gradient(to bottom, ${darken(.1, shades.coolGray)}, ${darken(.05, shades.coolGray2)})`,
  buttonBorderColor: darken(.3, shades.coolGray),
  buttonTextColor: '#000',

  buttonDarkBg: `linear-gradient(to bottom, ${lighten(.25, shades.coolGray7)}, ${lighten(.15, shades.coolGray7)})`,
  buttonDarkActiveBg: `linear-gradient(to bottom, ${lighten(.35, shades.coolGray7)}, ${lighten(.25, shades.coolGray7)})`,
  buttonDarkSelectedBg: `linear-gradient(to bottom, ${darken(.20, shades.coolGray2)}, ${darken(.30, shades.coolGray2)})`,
  buttonDarkBorderColor: '#000',
  buttonDarkTextColor: '#ccc',

  buttonLoginGoogleBg: '#dd4b39',
  buttonLoginGitHubBg: '#464646',
  buttonLoginFacebookBg: '#3b5998',

  errorTextBg: darken(.2, shades.coolGray),
};
