exports.REWARD_WALLET_CATEGORY = {
  REWARD: "reward",
  SURVEY: "survey",
  WITHDRAWAL: "withdrawal",
  REFUND: "refund",
  ADMIN_MANUAL: "admin_manual",
};

exports.REWARD_TRANSACTION_STATUS = {
  PENDING: 1,
  SUCCESS: 2,
  REJECTED: 3,
  REVERSED: 4,
};

exports.SURVEY_PROVIDER = {
  BITLABS: "bitlabs",
  CPX: "cpx",
};

exports.REWARD_WITHDRAWAL_STATUS = {
  PENDING: 1,
  APPROVED: 2,
  REJECTED: 3,
  PROCESSING: 4,
  COMPLETED: 5,
  FAILED: 6,
};

exports.BULK_PAYOUT_STATUS = {
  CREATED: 1,
  PROCESSING: 2,
  COMPLETED: 3,
  PARTIAL_SUCCESS: 4,
  FAILED: 5,
};
