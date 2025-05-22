// Vehicle type mapping
export const typeValueToKey = {
  "Vieglais auto": "car",
  "Car": "car",
  "Kravas auto": "truck",
  "Truck": "truck",
  "Piekabe": "trailer",
  "Trailer": "trailer",
  "Autobuss": "bus",
  "Bus": "bus",
  "Mopēds": "moped",
  "Moped": "moped",
  "Motocikls": "motorcycle",
  "Motorcycle": "motorcycle",
  "Tricikls": "tricycle",
  "Tricycle": "tricycle",
  "Laiva": "boat",
  "Boat": "boat",
  "Kuģis": "ship",
  "Ship": "ship",
  "Cits": "other",
  "Other": "other",
  "Tractor": "tractor",
  "tractor": "tractor"
};

// Status badge classes
export const getStatusBadgeClass = (status) => {
  switch (status && status.toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'inactive':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    case 'maintenance':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

// Document status classes
export const getDocumentStatusClass = (status) => {
  switch (status && status.toLowerCase()) {
    case 'valid':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'expired':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'expiring soon':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

// Calculate days remaining for a date
export const calculateDaysRemaining = (dateString) => {
  if (!dateString) return { days: null, status: 'unknown' };
  
  const dueDate = new Date(dateString);
  const today = new Date();
  
  // Set both dates to midnight to ignore time difference
  dueDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const differenceInTime = dueDate.getTime() - today.getTime();
  const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
  
  let status = 'valid';
  if (differenceInDays < 0) {
    status = 'expired';
  } else if (differenceInDays <= 30) {
    status = 'expiring soon';
  }
  
  return { days: differenceInDays, status };
};
