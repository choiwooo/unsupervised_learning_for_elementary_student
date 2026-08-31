const cols=[
 ["pencils","연필 개수"],["coloredPencils","색연필 개수"],["dolls","인형 개수"],["books","책 개수"],
 ["reading","독서(분)"],["exercise","운동(분)"],["game","게임(분)"],["youtube","영상시청(분)"],
 ["allowance","주간용돈(천원)"],["sleep","수면(시간)"]
];

const sample=[
 [8,12,2,20,30,60,40,50,5,9],[5,24,8,35,50,30,20,30,10,9.5],[12,6,1,15,15,80,90,100,8,8],
 [6,18,6,45,60,20,15,25,12,9.5],[10,12,3,25,35,50,50,60,7,8.5],[4,36,10,50,70,15,10,20,15,10],
 [7,24,7,40,55,25,20,35,10,9.5],[15,6,0,10,10,90,100,110,6,8],[9,12,2,30,40,55,45,55,8,9],
 [5,18,8,38,45,30,25,40,12,9.5],[11,12,3,22,25,70,80,90,7,8],[6,24,9,42,65,20,15,25,14,9.5],
 [8,36,5,55,80,15,10,20,15,10],[14,6,1,12,15,85,95,105,5,8.5],[3,18,7,36,50,35,30,45,10,9],
 [9,12,4,28,30,50,55,65,9,8.5],[7,24,6,44,60,25,20,30,12,9.5],[13,6,0,18,20,75,85,95,6,8],
 [5,36,10,48,75,20,10,15,14,10],[10,12,2,24,35,60,60,70,8,8.5]
];

let names=sample.map((_,i)=>`${i+1}번`);
let clusterChart=null,scoreChart=null;

function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

function buildTable(data,newNames=null){
 names=newNames||data.map((_,i)=>`${i+1}번`);
 document.querySelector("#dataTable thead").innerHTML="<tr><th>학생</th>"+cols.map(x=>`<th>${x[1]}</th>`).join("")+"</tr>";
 document.querySelector("#dataTable tbody").innerHTML=data.map((r,i)=>`<tr><td>${esc(names[i])}</td>${
  r.map((v,j)=>`<td><input type="number" step="${j===9?0.1:1}" value="${v}" data-r="${i}" data-c="${j}"></td>`).join("")
 }</tr>`).join("");
}

function readTable(){
 const n=document.querySelectorAll("#dataTable tbody tr").length;
 const X=Array.from({length:n},()=>Array(cols.length).fill(0));
 document.querySelectorAll("#dataTable input").forEach(el=>X[+el.dataset.r][+el.dataset.c]=Number(el.value));
 return X;
}

function standardize(X){
 const n=X.length,p=X[0].length,mean=Array(p).fill(0),sd=Array(p).fill(0);
 for(let j=0;j<p;j++){
  mean[j]=X.reduce((s,r)=>s+r[j],0)/n;
  sd[j]=Math.sqrt(X.reduce((s,r)=>s+(r[j]-mean[j])**2,0)/n)||1;
 }
 return X.map(r=>r.map((v,j)=>(v-mean[j])/sd[j]));
}
const d2=(a,b)=>a.reduce((s,v,i)=>s+(v-b[i])**2,0);
const dist=(a,b)=>Math.sqrt(d2(a,b));

function kmeans(X,k){
 const centers=[X[0].slice()];
 while(centers.length<k){
  let bi=0,bd=-1;
  X.forEach((r,i)=>{const d=Math.min(...centers.map(c=>d2(r,c)));if(d>bd){bd=d;bi=i}});
  centers.push(X[bi].slice());
 }
 let labels=Array(X.length).fill(-1);
 for(let t=0;t<100;t++){
  const next=X.map(r=>{const ds=centers.map(c=>d2(r,c));return ds.indexOf(Math.min(...ds))});
  const changed=next.some((v,i)=>v!==labels[i]);labels=next;
  for(let c=0;c<k;c++){
   const rows=X.filter((_,i)=>labels[i]===c);
   if(rows.length) centers[c]=X[0].map((_,j)=>rows.reduce((s,r)=>s+r[j],0)/rows.length);
  }
  if(!changed)break;
 }
 return labels;
}

function silhouette(X,labels,k){
 const s=X.map((r,i)=>{
  const own=labels[i],same=X.filter((_,j)=>labels[j]===own&&j!==i);
  if(!same.length)return 0;
  const a=same.reduce((z,x)=>z+dist(r,x),0)/same.length;
  let b=Infinity;
  for(let c=0;c<k;c++)if(c!==own){
   const other=X.filter((_,j)=>labels[j]===c);
   if(other.length)b=Math.min(b,other.reduce((z,x)=>z+dist(r,x),0)/other.length);
  }
  return (b-a)/Math.max(a,b);
 });
 return s.reduce((a,b)=>a+b,0)/s.length;
}

function cov(X){
 const p=X[0].length,n=X.length,C=Array.from({length:p},()=>Array(p).fill(0));
 for(let i=0;i<p;i++)for(let j=i;j<p;j++){
  const v=X.reduce((s,r)=>s+r[i]*r[j],0)/(n-1);C[i][j]=v;C[j][i]=v;
 } return C;
}
const mv=(A,v)=>A.map(r=>r.reduce((s,x,i)=>s+x*v[i],0));
const norm=v=>Math.sqrt(v.reduce((s,x)=>s+x*x,0));
function eig(A,shift=0){
 let v=Array.from({length:A.length},(_,i)=>1+((i+shift)%3));
 for(let t=0;t<120;t++){let w=mv(A,v),n=norm(w)||1;v=w.map(x=>x/n)}
 const Av=mv(A,v),val=v.reduce((s,x,i)=>s+x*Av[i],0);return {v,val};
}
function project2(X){
 const C=cov(X),e1=eig(C,0),D=C.map((r,i)=>r.map((x,j)=>x-e1.val*e1.v[i]*e1.v[j])),e2=eig(D,1);
 return X.map(r=>[r.reduce((s,x,i)=>s+x*e1.v[i],0),r.reduce((s,x,i)=>s+x*e2.v[i],0)]);
}

function means(raw,labels,k){
 return Array.from({length:k},(_,c)=>{
  const rows=raw.filter((_,i)=>labels[i]===c);
  return raw[0].map((_,j)=>rows.reduce((s,r)=>s+r[j],0)/rows.length);
 });
}

function render(raw,X,labels,k,scores){
 document.querySelector("#results").classList.remove("hidden");
 document.querySelector("#bestGroup").textContent=`추천 그룹 수: ${k}개`;

 const count=Array(k).fill(0);labels.forEach(x=>count[x]++);
 document.querySelector("#groupCounts").innerHTML=count.map((n,i)=>`<span class="badge">그룹 ${i+1}: ${n}명</span>`).join("");

 document.querySelector("#resultTable tbody").innerHTML=labels.map((c,i)=>`<tr><td>${esc(names[i])}</td><td>그룹 ${c+1}</td></tr>`).join("");

 const M=means(raw,labels,k);
 document.querySelector("#meanTable").innerHTML="<thead><tr><th>그룹</th>"+cols.map(x=>`<th>${x[1]}</th>`).join("")+"</tr></thead><tbody>"+
 M.map((r,c)=>`<tr><td>그룹 ${c+1}</td>${r.map(v=>`<td>${v.toFixed(1)}</td>`).join("")}</tr>`).join("")+"</tbody>";

 const pts=project2(X),colors=["#375dfb","#12b76a","#f79009","#7a5af8","#f04438","#06aed4"];
 if(clusterChart)clusterChart.destroy();
 clusterChart=new Chart(document.querySelector("#clusterChart"),{
  type:"scatter",
  data:{datasets:Array.from({length:k},(_,c)=>({
   label:`그룹 ${c+1}`,
   data:pts.map((p,i)=>({x:p[0],y:p[1],name:names[i],c:labels[i]})).filter(x=>x.c===c),
   backgroundColor:colors[c],pointRadius:7,pointHoverRadius:9
  }))},
  options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"bottom"},tooltip:{callbacks:{label:x=>`${x.raw.name} · ${x.dataset.label}`}}},
   scales:{x:{display:false},y:{display:false}}}
 });

 if(scoreChart)scoreChart.destroy();
 scoreChart=new Chart(document.querySelector("#scoreChart"),{
  type:"bar",
  data:{labels:scores.map(x=>`${x.k}개 그룹`),datasets:[{label:"나뉨 정도",data:scores.map(x=>x.score)}]},
  options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{min:-1,max:1}}}
 });
}

function analyze(){
 const raw=readTable();
 if(raw.length<7){alert("분석을 위해 학생 데이터를 7명 이상 넣어주세요.");return}
 if(raw.some(r=>r.some(v=>!Number.isFinite(v)))){alert("모든 칸에 숫자를 입력해주세요.");return}
 const X=standardize(raw),maxK=Math.min(6,raw.length-1),scores=[];
 for(let k=2;k<=maxK;k++){const labels=kmeans(X,k);scores.push({k,score:silhouette(X,labels,k),labels})}
 scores.sort((a,b)=>b.score-a.score);
 const best=scores[0];
 render(raw,X,best.labels,best.k,[...scores].sort((a,b)=>a.k-b.k));
}

async function loadFile(file){
 const msg=document.querySelector("#message");
 try{
  const buf=await file.arrayBuffer();
  const wb=XLSX.read(buf,{type:"array"});
  const ws=wb.Sheets[wb.SheetNames[0]];
  const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:""});
  if(rows.length<2)throw new Error("데이터 행이 없습니다.");

  const header=rows[0].map(x=>String(x).trim());
  const keyIndex=cols.map(([key,label])=>{
   let idx=header.indexOf(key);
   if(idx<0)idx=header.indexOf(label);
   return idx;
  });
  if(keyIndex.some(i=>i<0))throw new Error("필요한 10개 열을 찾지 못했습니다.");

  const nameIdx=header.findIndex(h=>["student","학생","name","이름"].includes(h));
  const data=[],newNames=[];
  for(let r=1;r<rows.length;r++){
   if(rows[r].every(x=>x===""))continue;
   const vals=keyIndex.map(i=>Number(rows[r][i]));
   if(vals.some(v=>!Number.isFinite(v)))throw new Error(`${r+1}행에 숫자가 아닌 값이 있습니다.`);
   data.push(vals);
   newNames.push(nameIdx>=0&&rows[r][nameIdx]!==""?String(rows[r][nameIdx]):`${data.length}번`);
  }
  if(!data.length)throw new Error("읽을 데이터가 없습니다.");
  buildTable(data,newNames);
  document.querySelector("#results").classList.add("hidden");
  msg.textContent=`${file.name}에서 ${data.length}명의 데이터를 불러왔습니다.`;
  msg.className="message ok";
 }catch(e){
  msg.textContent=`파일을 읽지 못했습니다: ${e.message}`;
  msg.className="message err";
 }
}

document.querySelector("#runBtn").addEventListener("click",analyze);
document.querySelector("#resetBtn").addEventListener("click",()=>{buildTable(sample);document.querySelector("#results").classList.add("hidden");});
document.querySelector("#fileInput").addEventListener("change",e=>{if(e.target.files[0])loadFile(e.target.files[0])});
buildTable(sample);
