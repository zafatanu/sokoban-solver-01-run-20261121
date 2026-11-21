const fs=require("fs"),I=process.env.MAKEFUN_INPUT_DIR||"/input",O=process.env.MAKEFUN_OUTPUT_DIR||"/output";
function walkBack(b,W,room,outcell,end,goals){
 const R=new Set(room.cells),D4=[-W,W,-1,1],dc="udlr",vis=new Set([end]),q=[end],walk={[end]:""};
 for(let qi=0;qi<q.length;qi++){
  const c=q[qi],cw=walk[c];
  for(let k=0;k<4;k++){const n=c+D4[k];
   if(b[n]=="#"||vis.has(n)||goals.has(n))continue;
   if(!R.has(n)&&n!==outcell)continue;
   vis.add(n);walk[n]=cw+dc[k];q.push(n);}
 }
 return walk[outcell]||"";
}
function roomSolve(b,W,room,outcell){
 const R=new Set(room.cells),goals=new Set();let boxes=[];
 for(const c of room.cells){if(b[c]==".")goals.add(c);if(b[c]=="$")boxes.push(c);}
 boxes.sort((a,c)=>a-c);
 const ext=new Set(room.cells);for(const o of room.outs)ext.add(o);
 const D4=[-W,W,-1,1],dc="udlr",seen=new Set([boxes.join(",")+"|"+outcell]),q=[[boxes,outcell,""]];
 for(let qi=0;qi<q.length;qi++){
  const bs=q[qi][0],pos=q[qi][1],m=q[qi][2];
  let done=true;for(const x of bs)if(!goals.has(x)){done=false;break;}
  if(done)return {sol:m,end:pos};
  const bs_=new Set(bs),vis=new Set([pos]),que=[pos],walk={[pos]:""};
  for(let qi2=0;qi2<que.length;qi2++){
   const c=que[qi2],cw=walk[c];
   for(let k=0;k<4;k++){const n=c+D4[k];
    if(b[n]=="#"||bs_.has(n)||vis.has(n))continue;
    if(!ext.has(n))continue;
    vis.add(n);walk[n]=cw+dc[k];que.push(n);}
  }
  for(let bi=0;bi<bs.length;bi++){
   const B=bs[bi];
   for(let k=0;k<4;k++){
    const pp=B-D4[k],de=B+D4[k];
    if(walk[pp]!==undefined&&b[de]!="#"&&!bs_.has(de)&&R.has(de)){
     const nb=bs.slice();nb[bi]=de;nb.sort((a,c)=>a-c);
     const key=nb.join(",")+"|"+B;
     if(!seen.has(key)){seen.add(key);q.push([nb,B,m+walk[pp]+dc[k].toUpperCase()]);}
    }
   }
  }
 }
 return {sol:"",end:outcell};
}
function solveOne(id){
 const lv=fs.readFileSync(I+"/"+id+"/level.txt","utf8");
 const L=lv.split("\n").filter(r=>r.length),w=L.reduce((a,r)=>r.length>a?r.length:a,0);
 let b="#".repeat(w+2);for(const r of L)b+="#"+r.padEnd(w," ")+"#";b+="#".repeat(w+2);
 const W=w+2,p=b.indexOf("@"),P=Math.floor(p/W);
 const wall=i=>b[i]=="#"||Math.floor(i/W)==P;
 const seen={},D4=[-W,W,-1,1];let rooms=[];
 for(let i=0;i<b.length;i++){
  if(wall(i)||seen[i]!==undefined)continue;
  const q=[i];seen[i]=1;const cells=[];
  while(q.length){const c=q.pop();cells.push(c);for(const dd of D4){const n=c+dd;if(!wall(n)&&seen[n]===undefined){seen[n]=1;q.push(n);}}}
  rooms.push(cells);
 }
 rooms=rooms.map(cells=>{
  const outset=new Set();
  for(const c of cells){if(b[c-W]!="#"&&Math.floor((c-W)/W)==P)outset.add(c-W);if(b[c+W]!="#"&&Math.floor((c+W)/W)==P)outset.add(c+W);}
  const outs=Array.from(outset).sort((a,c)=>a-c);
  return {cells,outs,doorcol:outs.length?outs[0]%W:0};
 });
 rooms.sort((a,c)=>a.doorcol-c.doorcol);
 let cur=p,out="";
 for(const room of rooms){
  const outcell=room.outs[0],cwx=cur%W,owx=outcell%W;
  if(owx<cwx){for(let x=0;x<cwx-owx;x++)out+="l";}else{for(let x=0;x<owx-cwx;x++)out+="r";}
  cur=outcell;
  const r=roomSolve(b,W,room,outcell);
  out+=r.sol;
  const gs=new Set();for(const c of room.cells)if(b[c]==".")gs.add(c);
  const back=walkBack(b,W,room,outcell,r.end,gs);
  out+=back;cur=outcell;
 }
 return out;
}
for(const id of fs.readdirSync(I)){
 fs.mkdirSync(O+"/"+id,{recursive:true});
 fs.writeFileSync(O+"/"+id+"/solution.txt",solveOne(id));
}