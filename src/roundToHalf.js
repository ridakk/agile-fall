export default number => {
  // Check if number is less than 0.5, set it to 0.5
  if (number < 0.5) {
    return 0.5;
  }

  // Round the number to the nearest multiple of 0.5
  return Math.round(number * 2) / 2;
};
