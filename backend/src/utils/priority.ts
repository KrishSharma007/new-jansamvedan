const CATEGORY_WEIGHTS: Record<string, number> = {
  Electricity: 4,
  "Gas Leak": 5,
  Sewage: 4,
  Drainage: 4,
  "Water Supply": 4,
  Pothole: 3,
  "Road Repair": 3,
  "Traffic Signal": 3,
  "Garbage Collection": 2,
  "Street Light": 2,
  "Public Toilet": 2,
  Footpath: 2,
  "Park Maintenance": 1,
  "Public Garden": 1,
  "Bus Stop": 1,
  "Traffic Sign": 1,
};

export interface PriorityResult {
  priorityScore: number;
  computedPriority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
}

export function calculatePriorityScoreAndLevel(
  category: string,
  confirmationsCount: number = 0,
  createdAt: Date | string
): PriorityResult {
  const baseScore = CATEGORY_WEIGHTS[category] || 2;
  const confirmationBoost = Math.floor(confirmationsCount / 2);

  const createdDate = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.max(0, now.getTime() - createdDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const ageBoost = Math.floor(diffDays / 3);

  const priorityScore = baseScore + confirmationBoost + ageBoost;

  let computedPriority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" = "LOW";
  if (priorityScore >= 8) {
    computedPriority = "URGENT";
  } else if (priorityScore >= 5) {
    computedPriority = "HIGH";
  } else if (priorityScore >= 3) {
    computedPriority = "MEDIUM";
  }

  return { priorityScore, computedPriority };
}

export function enrichWithComputedPriority<T extends { category: string; confirmationsCount?: number; createdAt: Date | string }>(
  complaint: T
): T & PriorityResult {
  const confirmations = complaint.confirmationsCount || 0;
  const { priorityScore, computedPriority } = calculatePriorityScoreAndLevel(
    complaint.category,
    confirmations,
    complaint.createdAt
  );

  return {
    ...complaint,
    priorityScore,
    computedPriority,
    priority: computedPriority.toLowerCase(), // sync standard priority field for backwards compatibility
  };
}
