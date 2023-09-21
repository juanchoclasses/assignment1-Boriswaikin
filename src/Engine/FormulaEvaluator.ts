import Cell from "./Cell"
import SheetMemory from "./SheetMemory"
import { ErrorMessages } from "./GlobalDefinitions";

// export interface IStack<T> {
//   push(item: T): void;
//   pop(): T | undefined;
//   peek(): T | undefined;
//   size(): number;
// }

// export class Stack<T> implements IStack<T> {
//   private storage: T[] = [];

//   constructor(private capacity: number = Infinity) {}

//   push(item: T): void {
//     if (this.size() === this.capacity) {
//       throw Error("Stack has reached max capacity, you cannot add more items");
//     }
//     this.storage.push(item);
//   }

//   pop(): T | undefined {
//     return this.storage.pop();
//   }

//   peek(): T | undefined {
//     return this.storage[this.size() - 1];
//   }

//   size(): number {
//     return this.storage.length;
//   }
// }

export class FormulaEvaluator {
  // Define a function called update that takes a string parameter and returns a number
  private _errorOccured: boolean = false;
  private _errorMessage: string = "";
  private _currentFormula: FormulaType = [];
  private _lastResult: number = 0;
  private _sheetMemory: SheetMemory;
  private _result: number = 0;


  constructor(memory: SheetMemory) {
    this._sheetMemory = memory;
  }

  /**
    * place holder for the evaluator.   I am not sure what the type of the formula is yet 
    * I do know that there will be a list of tokens so i will return the length of the array
    * 
    * I also need to test the error display in the front end so i will set the error message to
    * the error messages found In GlobalDefinitions.ts
    * 
    * according to this formula.
    * 
    7 tokens partial: "#ERR",
    8 tokens divideByZero: "#DIV/0!",
    9 tokens invalidCell: "#REF!",
  10 tokens invalidFormula: "#ERR",
  11 tokens invalidNumber: "#ERR",
  12 tokens invalidOperator: "#ERR",
  13 missingParentheses: "#ERR",
  0 tokens emptyFormula: "#EMPTY!",

                    When i get back from my quest to save the world from the evil thing i will fix.
                      (if you are in a hurry you can fix it yourself)
                               Sincerely 
                               Bilbo
    * 
   */

  calculate(formula: FormulaType): number {
    const stack: number[] = [];
    let num: number = 0;
    let sign: string = '+';
    const n: number = formula.length;
    for (let i = 0; i < n; i++) {
      const str: string = formula[i];
      if (/\d/.test(str)) {
        num = num * 10 + parseInt(str,10);
      }
      else if (str === "("){
        let j: number;
        let braces: number = 1;
        for (j = i + 1; j < n; j++) {
          if (formula[j] === "(") braces++;
          else if (formula[j] === ")") braces--;
          if (braces === 0) break;
        }
        num = this.calculate(formula.slice(i + 1, j));
        i = j;
      }
      if (str === '+' || str === '-' || str === '*' || str === '/' || i === n - 1) {
        switch (sign) {
            case '+':
                stack.push(num);
                break;
            case '-':
                stack.push(-num);
                break;
            case '*':
                let val: number | undefined = stack.pop();
                if (val!=undefined) stack.push(val * num);
                break;
            case '/':
                val = stack.pop();
                if (val!=undefined) stack.push(val / num);
                break;
        }
        num = 0;
        sign = str;
      }
    }
    let result: number = 0;
    while (stack.length > 0) result += stack.pop()!;
    return result;
  }

  evaluate(formula: FormulaType) {

    // const stack = new Stack<number>();
    // set the this._result to the length of the formula

    this._result = this.calculate(formula);
    this._errorMessage = "";

    switch (formula.length) {
      case 0:
        this._errorMessage = ErrorMessages.emptyFormula;
        break;
      case 7:
        this._errorMessage = ErrorMessages.partial;
        break;
      case 8:
        this._errorMessage = ErrorMessages.divideByZero;
        break;
      case 9:
        this._errorMessage = ErrorMessages.invalidCell;
        break;
      case 10:
        this._errorMessage = ErrorMessages.invalidFormula;
        break;
      case 11:
        this._errorMessage = ErrorMessages.invalidNumber;
        break;
      case 12:
        this._errorMessage = ErrorMessages.invalidOperator;
        break;
      case 13:
        this._errorMessage = ErrorMessages.missingParentheses;
        break;
      default:
        this._errorMessage = "";
        break;
    }
  }

  public get error(): string {
    return this._errorMessage
  }

  public get result(): number {
    return this._result;
  }




  /**
   * 
   * @param token 
   * @returns true if the toke can be parsed to a number
   */
  isNumber(token: TokenType): boolean {
    return !isNaN(Number(token));
  }

  /**
   * 
   * @param token
   * @returns true if the token is a cell reference
   * 
   */
  isCellReference(token: TokenType): boolean {

    return Cell.isValidCellLabel(token);
  }

  /**
   * 
   * @param token
   * @returns [value, ""] if the cell formula is not empty and has no error
   * @returns [0, error] if the cell has an error
   * @returns [0, ErrorMessages.invalidCell] if the cell formula is empty
   * 
   */
  getCellValue(token: TokenType): [number, string] {

    let cell = this._sheetMemory.getCellByLabel(token);
    let formula = cell.getFormula();
    let error = cell.getError();

    // if the cell has an error return 0
    if (error !== "" && error !== ErrorMessages.emptyFormula) {
      return [0, error];
    }

    // if the cell formula is empty return 0
    if (formula.length === 0) {
      return [0, ErrorMessages.invalidCell];
    }
  


    let value = cell.getValue();
    return [value, ""];

  }


}

export default FormulaEvaluator;