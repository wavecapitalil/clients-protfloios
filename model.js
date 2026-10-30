(function(root){
  'use strict';
  function cagr(rs){return Math.exp(rs.reduce((s,r)=>s+Math.log1p(r),0)/rs.length)-1;}
  function historical(data,weights,start){
    const ids=data.years.map((y,i)=>i).filter(i=>data.years[i]>=start);
    const returns=ids.map(i=>weights.reduce((s,w,j)=>s+w*data.assets[j].returns[i]/100,0));
    return {returns,years:ids.map(i=>data.years[i]),cagr:cagr(returns),worst:Math.min(...returns)};
  }
  function project(p,r,monthly,years){
    const mr=Math.pow(1+r,1/12)-1;const points=[{age:p.age,own:p.initial,paid:p.initial}];let value=p.initial;
    for(let m=1;m<=years*12;m++){value=value*(1+mr)+monthly;if(m%12===0)points.push({age:p.age+m/12,own:value,paid:p.initial+m*monthly});}
    return points;
  }
  function calculate(data,p){
    const nums=[p.age,p.target,p.initial,p.monthly,p.existing,p.existingMonthly,p.fx,p.fee,p.inflation,...p.weights];
    if(nums.some(v=>!Number.isFinite(v)))throw Error('יש למלא את כל שדות המספרים');
    if(!Number.isInteger(p.age)||!Number.isInteger(p.target)||p.age<0||p.target<p.age||p.target>100)throw Error('גיל היעד חייב להיות גיל שלם בין הגיל הנוכחי ל 100');
    if([p.initial,p.monthly,p.existing,p.existingMonthly,p.fee,...p.weights].some(v=>v<0)||p.fee>=1||p.weights.some(v=>v>1))throw Error('סכומים ומשקלים חייבים להיות חיוביים או אפס, ועלויות קטנות מ 100%');
    if(Math.abs(p.weights.reduce((a,b)=>a+b,0)-1)>1e-8)throw Error('סכום המשקלים חייב להיות 100%');
    if(p.fx<=-1||p.inflation<=-1)throw Error('הנחת מטבע ואינפלציה חייבת להיות גדולה ממינוס 100%');
    if(![2016,2021].includes(p.start))throw Error('תקופת עבר לא תקינה');
    const h=historical(data,p.weights,p.start);
    const base=p.mode==='manual'?p.manual:h.cagr;
    if(!Number.isFinite(base)||base<=-1)throw Error('תשואה שנתית חייבת להיות גדולה ממינוס 100%');
    const net=(1+base)*(1+p.fx)*(1-p.fee)-1;
    let points=project(p,net,p.monthly,p.target-p.age);
    let existingPoints=null;
    if(p.existingRate!==null){if(!Number.isFinite(p.existingRate)||p.existingRate<=-1)throw Error('תשואת הקופה חייבת להיות גדולה ממינוס 100%');existingPoints=project({...p,initial:p.existing},p.existingRate,p.existingMonthly,p.target-p.age);}
    points=points.map((x,i)=>({...x,existing:existingPoints?existingPoints[i].own:null,combined:existingPoints?x.own+existingPoints[i].own:null,real:x.own/Math.pow(1+p.inflation,i)}));
    return {h,net,points,last:points[points.length-1]};
  }
  const api={cagr,historical,project,calculate};root.PortfolioModel=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
