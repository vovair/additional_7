module.exports = function solveSudoku(matrix) {
  const numbers = [1, 1 << 1, 1 << 2, 1 << 3, 1 << 4, 1 << 5, 1 << 6, 1 << 7, 1 << 8];
  const row = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  const column = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  const square = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  let toFill = [];
  const result = matrix.map(arr => arr.slice());

  const getNumbers = value => {
    return numbers.reduce((ret, n, index) => {
      if (!(n & value)) ret.push(index + 1);
      return ret;
    }, []);
  };

  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (!matrix[i][j]) {
        let obj = {row: i, col: j, value: 0, numbers: []};
        toFill.push(obj);
        continue;
      }
      row[i] = row[i] | numbers[matrix[i][j] - 1];
      column[j] = column[j] | numbers[matrix[i][j] - 1];
      square[((i / 3) >> 0) * 3 + ((j / 3) >> 0)] =
        square[((i / 3) >> 0) * 3 + ((j / 3) >> 0)] | numbers[matrix[i][j] - 1];
    }
  }

  toFill.forEach(obj => {
    const {row: i, col: j} = obj;
    const value = ~(
      (row[i] | column[j] | square[((i / 3) >> 0) * 3 + ((j / 3) >> 0)]) ^
      0xffffffff
    );
    obj.value = value;
    obj.numbers = getNumbers(value);
  });

  const findStep = currentStep => {
    if (currentStep != null) {
      const {i, j, numbers: stepNumbers, current} = currentStep;
      if (stepNumbers.length > current + 1)
        return {i, j, value: stepNumbers[current + 1], numbers: stepNumbers, current: current + 1};
      return null;
    }
    const minItem = toFill.reduce(
      (ret, p) => {
        const {min} = ret;
        if (p.numbers.length < min) return {min: p.numbers.length, item: p};
        return ret;
      },
      {min: Number.MAX_SAFE_INTEGER, item: null}
    );
    if (minItem.item == null) return null;
    const {item: {row: i, col: j, numbers: itemNumbers} = {}} = minItem;
    return itemNumbers.length == 0
      ? null
      : {i, j, value: itemNumbers[0], numbers: itemNumbers, current: 0};
  };

  const isIntersected = (i, j, i1, j1) => {
    return (
      i == i1 ||
      j == j1 ||
      ((i / 3) >> 0) * 3 + ((j / 3) >> 0) == ((i1 / 3) >> 0) * 3 + ((j1 / 3) >> 0)
    );
  };

  const makeStep = step => {
    const {i, j, value} = step;
    row[i] = row[i] | numbers[value - 1];
    column[j] = column[j] | numbers[value - 1];
    square[((i / 3) >> 0) * 3 + ((j / 3) >> 0)] =
      square[((i / 3) >> 0) * 3 + ((j / 3) >> 0)] | numbers[value - 1];
    toFill = toFill.filter(obj => obj.row != i || obj.col != j);
    toFill.forEach(obj => {
      const {row: ii, col: jj} = obj;
      if (!isIntersected(i, j, ii, jj)) return;
      obj.value = ~(
        (row[ii] | column[jj] | square[((ii / 3) >> 0) * 3 + ((jj / 3) >> 0)]) ^
        0xffffffff
      );
      obj.numbers = getNumbers(obj.value);
    });
    result[i][j] = value;
  };

  const backStep = step => {
    const {i, j, value} = step;
    row[i] &= ~numbers[value - 1];
    column[j] &= ~numbers[value - 1];
    square[((i / 3) >> 0) * 3 + ((j / 3) >> 0)] &= ~numbers[value - 1];

    toFill.push({
      row: i,
      col: j,
      value: ~((row[i] | column[j] | square[((i / 3) >> 0) * 3 + ((j / 3) >> 0)]) ^ 0xffffffff),
      numbers: []
    });
    toFill.forEach(obj => {
      const {row: ii, col: jj} = obj;
      if (!isIntersected(i, j, ii, jj)) return;
      if (ii != i || jj != j) obj.value = obj.value & ~(numbers[value - 1] ^ 0xffffffff);
      obj.numbers = getNumbers(obj.value);
    });
    result[i][j] = 0;
  };

  const steps = [];
  let prevStep = null;
  while (true) {
    if (toFill.length == 0) {
      return result;
    }
    let step = findStep(prevStep);
    if (prevStep != null && step != null) {
      steps.pop();
      backStep(prevStep);
    }
    if (step == null) {
      if (steps.length > 0) {
        const s = steps.pop();
        backStep(s);
        prevStep = steps.length > 0 ? steps[steps.length - 1] : null;
        continue;
      }
      // could not find solution
      return result;
    }
    prevStep = null;
    steps.push(step);
    makeStep(step);
  }
  return matrix;
};
