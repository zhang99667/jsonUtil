type DriverFactory = typeof import('driver.js').driver;

export const loadDriverTour = async (): Promise<DriverFactory> => {
  await import('driver.js/dist/driver.css');
  await import('../styles/driverTourOverrides.css');

  const module = await import('driver.js');
  return module.driver;
};
