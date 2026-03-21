import chalk from 'chalk';

/**
 * VidX Design System
 * 
 * Main: #fb923c (Amber-400)
 * Deep: #ea580c (Orange-600)
 */
export const brand = (t) => chalk.bold.hex('#fb923c')(t);
export const brandDeep = (t) => chalk.bold.hex('#ea580c')(t);
export const brandDim = (t) => chalk.hex('#fb923c')(t);
export const brandDeepDim = (t) => chalk.hex('#ea580c')(t);

export const logo = {
  v: (t) => chalk.bold.hex('#fb923c')(t),
  x: (t) => chalk.bold.hex('#ea580c')(t),
};
