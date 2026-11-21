const fs=require("fs"),A=process.env.MAKEFUN_INPUT_DIR||"/input",O=process.env.MAKEFUN_OUTPUT_DIR||"/output";
const S=(b,W,C,Oc)=>{const R={},G={},E={};let B=[];for(const c of C){R[c]=E[c]=1;const ch=b[c];if(ch==".")G[c]=1;else if(ch=="$")B.push(c)}for(const o of Oc)E[o]=1;B.sort((a,b)=>a-b);const D=[-W,W,-1,1],x="udlr",U="UDLR",V={},Q=[[B,Oc[0],""]];for(let qi=0;qi<Q.length;qi++){const bx=Q[qi][0],po=Q[qi][1],m=Q[qi][2],s={};bx.map(c=>s[c]=1);const v={[po]:1},q=[po],w={[po]:""};for(let a=0;a<q.length;a++){const c=q[a],cw=w[c];for(let k=0;k<4;k++){const n=c+D[k];if(b[n]=="#"||s[n]||v[n]||!E[n])continue;v[n]=1;w[n]=cw+x[k];q.push(n)}}let ok=1;for(const c of bx)if(!G[c]){ok=0;break}if(ok&&v[Oc[0]])return m+w[Oc[0]];for(let bi=0;bi<bx.length;bi++){const z=bx[bi];for(let k=0;k<4;k++){const pp=z-D[k],de=z+D[k];if(v[pp]&&b[de]!="#"&&!s[de]&&R[de]){const nb=bx.slice();nb[bi]=de;nb.sort((a,b)=>a-b);const key=nb.join(",")+"|"+z;if(!V[key]){V[key]=1;Q.push([nb,z,m+w[pp]+U[k]])}}}}}return""};
for(const id of fs.readdirSync(A)){
 const L=fs.readFileSync(A+"/"+id+"/level.txt","utf8").split("\n").filter(r=>r.length),w=L.reduce((a,r)=>r.length>a?r.length:a,0);
 let b="#".repeat(w+2);for(const r of L)b+="#"+r.padEnd(w," ")+"#";b+="#".repeat(w+2);
 const W=w+2,p=b.indexOf("@"),P=p/W|0,wa=x=>b[x]=="#"||(x/W|0)==P;
 let rms=[],se={};
 for(let i=0;i<b.length;i++){if(wa(i)||se[i]!==undefined)continue;const q=[i];se[i]=1;const cc=[];while(q.length){const c=q.pop();cc.push(c);for(const dd of[-W,W,-1,1]){const n=c+dd;if(!wa(n)&&se[n]===undefined){se[n]=1;q.push(n)}}}rms.push(cc)}
 rms=rms.map(cc=>{const o={};for(const c of cc){if(b[c-W]!="#"&&((c-W)/W|0)==P)o[c-W]=1;if(b[c+W]!="#"&&((c+W)/W|0)==P)o[c+W]=1}const oc=Object.keys(o).map(Number).sort((a,b)=>a-b);return[cc,oc]}).sort((a,b)=>a[1][0]-b[1][0]);
 let cur=p,out="";
 for(const rm of rms){const oc=rm[1][0],cw=cur%W,ow=oc%W;out+=ow<cw?"l".repeat(cw-ow):"r".repeat(ow-cw);cur=oc;out+=S(b,W,rm[0],rm[1])}
 fs.mkdirSync(O+"/"+id,{recursive:true});fs.writeFileSync(O+"/"+id+"/solution.txt",out);
}