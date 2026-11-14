import { businessCase, challengeDays, experimentResult, findIdea, fundingPosition, validNumber } from './operations';
import { addReceipt, getReceipts, resetReceipts } from './sessionStore';

describe('deterministic innovation calculations',()=>{
  test('models confidence-adjusted payback and first-year ROI',()=>{
    expect(businessCase(120000,180000,30000,50)).toEqual({net:150000,adjusted:60000,roi:25,payback:24});
  });
  test('does not invent payback for negative net benefit',()=>{
    expect(businessCase(120000,20000,30000,50).payback).toBeUndefined();
  });
  test.each([[800000,false,0],[800001,true,-1],[0,false,800000]])('funding envelope %i',(amount,overBudget,remaining)=>{
    expect(fundingPosition(amount)).toEqual({overBudget,remaining});
  });
  test.each([
    [30,30,10,8,20,0,'Go'],[29,30,10,8,20,0,'Pivot'],[30,30,10,8.01,20,0,'Pivot'],[30,30,10,8,20,1,'Stop']
  ])('evaluates sample %i against predeclared thresholds',(sample,minimum,baseline,observed,target,incidents,recommendation)=>{
    expect(experimentResult(Number(sample),Number(minimum),Number(baseline),Number(observed),Number(target),Number(incidents)).recommendation).toBe(recommendation);
  });
  test('checks finite bounded values and date windows',()=>{
    expect(validNumber('')).toBe(false);expect(validNumber('Infinity')).toBe(false);expect(validNumber('-1')).toBe(false);
    expect(validNumber('100',0,100)).toBe(true);expect(validNumber('101',0,100)).toBe(false);
    expect(challengeDays('2026-11-01','2026-11-08')).toBe(7);
  });
  test('never resolves an explicit unknown ID to another idea',()=>{
    expect(findIdea('IDEA-NOT-FOUND')).toBeUndefined();expect(findIdea()?.id).toBe('IDEA-001');
  });
  test('records distinct semantic immutable receipts and resets the session',()=>{
    resetReceipts();const values={amount:400000};
    const first=addReceipt('ReviewInnovationFunding','Finance','Approve','Funding decision',values);
    values.amount=1;
    const second=addReceipt('SubmitInnovationIdea','Innovator','Intake','Idea submission');
    expect(first.values.amount).toBe(400000);expect(first.id).not.toBe(second.id);expect(getReceipts()).toHaveLength(2);
    resetReceipts();expect(getReceipts()).toHaveLength(0);
  });
});
