var e=null,t=0,n=`attribute vec2 a_position;varying vec2 v_uv;void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}`,r=`precision highp float;
uniform sampler2D u_image;
uniform vec2 u_size,u_imageSize,u_position,u_pointer,u_shift;
uniform float u_mix,u_hunt,u_motion;
varying vec2 v_uv;
vec2 cover(vec2 uv){
  vec2 scale=u_size/u_imageSize;float fill=max(scale.x,scale.y);
  vec2 visible=u_size/(u_imageSize*fill);
  return clamp(uv*visible+(1.-visible)*u_position,vec2(.001),vec2(.999));
}
void main(){
  vec2 uv=vec2(v_uv.x,1.-v_uv.y);
  vec2 toFocus=(uv-u_pointer)*vec2(u_size.x/u_size.y,1.);
  float focusDistance=length(toFocus);
  float localField=exp(-focusDistance*focusDistance*5.);
  float breath=u_mix*(.017+u_hunt*.026);
  vec2 sampleUv=(uv-.5)/(1.+breath)+.5;
  sampleUv+=(u_pointer-.5)*u_mix*.015;
  sampleUv+=u_shift*(.004+u_hunt*.008)*u_mix;
  sampleUv+=(uv-u_pointer)*localField*u_motion*.013;
  vec2 imageUv=cover(sampleUv);
  float blur=(u_hunt*7.+u_motion*2.4)*(1.-localField*.85)+u_mix*.25;
  float angle=0.;vec3 color=vec3(0.);
  for(int i=0;i<16;i++){
    float r=sqrt((float(i)+.5)/16.)*blur;
    angle+=2.399963;
    vec2 delta=vec2(cos(angle),sin(angle))*r/u_size;
    color+=texture2D(u_image,cover(sampleUv+delta)).rgb;
  }
  color/=16.;
  float fringe=(u_hunt*.85+u_motion*.45)*u_mix;
  vec2 chroma=normalize(toFocus+vec2(.001))*fringe/u_imageSize;
  color.r=mix(color.r,texture2D(u_image,imageUv+chroma).r,.24);
  color.b=mix(color.b,texture2D(u_image,imageUv-chroma).b,.24);
  gl_FragColor=vec4(color,1.);
}`;function i(){let e=document.createElement(`canvas`);e.className=`focus-image__canvas`,e.setAttribute(`aria-hidden`,`true`);let t=e.getContext(`webgl`,{alpha:!1,antialias:!1,depth:!1,stencil:!1,powerPreference:`low-power`});if(!t)return null;let i=(e,n)=>{let r=t.createShader(e);return t.shaderSource(r,n),t.compileShader(r),t.getShaderParameter(r,t.COMPILE_STATUS)?r:(t.deleteShader(r),null)},a=i(t.VERTEX_SHADER,n),o=i(t.FRAGMENT_SHADER,r);if(!a||!o)return a&&t.deleteShader(a),o&&t.deleteShader(o),null;let s=t.createProgram();if(t.attachShader(s,a),t.attachShader(s,o),t.linkProgram(s),t.deleteShader(a),t.deleteShader(o),!t.getProgramParameter(s,t.LINK_STATUS))return t.deleteProgram(s),null;t.useProgram(s);let c=t.createBuffer();t.bindBuffer(t.ARRAY_BUFFER,c),t.bufferData(t.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),t.STATIC_DRAW);let l=t.getAttribLocation(s,`a_position`);t.enableVertexAttribArray(l),t.vertexAttribPointer(l,2,t.FLOAT,!1,0,0);let u=t.createTexture();t.bindTexture(t.TEXTURE_2D,u),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),t.pixelStorei(t.UNPACK_FLIP_Y_WEBGL,!1);let d=Object.fromEntries([`size`,`imageSize`,`position`,`pointer`,`shift`,`mix`,`hunt`,`motion`].map(e=>[e,t.getUniformLocation(s,`u_${e}`)])),f=null,p=0,m=0,h=0,g=0,_=0,v=0,y=.5,b=.5,x=.5,S=.5,C=!1,w=()=>{if(!f)return;let n=f.host.getBoundingClientRect(),r=Math.min(1.5,window.devicePixelRatio||1,1440/Math.max(n.width,1));e.width=Math.max(1,Math.round(n.width*r)),e.height=Math.max(1,Math.round(n.height*r)),t.viewport(0,0,e.width,e.height),t.uniform2f(d.size,n.width,n.height)},T=new ResizeObserver(()=>{w(),O()});function E(){cancelAnimationFrame(p),p=0,f&&(delete f.host.dataset.focusRendered,delete f.host.dataset.focusActive,delete f.host.dataset.focusLocked),T.disconnect(),e.remove(),f=null,C=!1}function D(e){if(p=0,!f||document.hidden){E();return}let n=Math.min((e-m)/1e3||.016,.05);m=e;let r=1-Math.exp(-n*11);_+=(+!!C-_)*r,y+=(x-y)*r,b+=(S-b)*r,v*=Math.exp(-n*6);let i=(e-h)/1e3,a=C?Math.exp(-i*3.2)*(.5+.5*Math.cos(i*17)):0;t.uniform2f(d.pointer,y,b),t.uniform2f(d.shift,Math.sin(i*27)*a,Math.cos(i*21)*a),t.uniform1f(d.mix,_),t.uniform1f(d.hunt,a*_),t.uniform1f(d.motion,v*_),t.drawArrays(t.TRIANGLES,0,6),f.host.dataset.focusRendered=`true`,f.host.dataset.focusLocked=String(C&&e-g>380&&i>.65),f.host.style.setProperty(`--focus-x`,`${y*100}%`),f.host.style.setProperty(`--focus-y`,`${b*100}%`);let o=Math.abs(x-y)+Math.abs(S-b)>3e-4;(C?i<1.8||v>.001||o||_<.999:_>.002)?O():C||E()}function O(){f&&!p&&!document.hidden&&(p=requestAnimationFrame(D))}let k={enter(n,r,i){if(!(!r.complete||!r.naturalWidth||document.hidden||t.isContextLost())){if(f?.host!==n){E(),f={host:n,image:r},n.append(e),_=0;let i=getComputedStyle(r).objectPosition.split(` `).map(e=>Number.parseFloat(e)/100);t.uniform2f(d.position,Number.isFinite(i[0])?i[0]:.5,Number.isFinite(i[1])?i[1]:.5),t.uniform2f(d.imageSize,r.naturalWidth,r.naturalHeight);try{t.texImage2D(t.TEXTURE_2D,0,t.RGB,t.RGB,t.UNSIGNED_BYTE,r)}catch{E();return}w(),T.observe(n)}C=!0,h=performance.now(),g=h,m=h,y=x=i?.[0]??.5,b=S=i?.[1]??.5,v=0,n.dataset.focusActive=`true`,n.dataset.focusLocked=`false`,O()}},move(e,t){if(f?.host!==e||!C)return;let n=Math.hypot(t[0]-x,t[1]-S);v=Math.min(1,v+n*3),n>.001&&(g=performance.now()),[x,S]=t,O()},leave(e,t=!1){f?.host===e&&(t?E():(C=!1,e.dataset.focusActive=`false`,O()))},dispose(){E(),document.removeEventListener(`visibilitychange`,A),e.removeEventListener(`webglcontextlost`,E),t.deleteTexture(u),t.deleteBuffer(c),t.deleteProgram(s)}},A=()=>{document.hidden&&E()};return document.addEventListener(`visibilitychange`,A),e.addEventListener(`webglcontextlost`,E),k}function a(n,r){t++;let a=window.matchMedia(`(prefers-reduced-motion: reduce)`),o=window.matchMedia(`(hover: hover) and (pointer: fine)`),s=n.closest(`a,button`),c=s||n;s||(n.tabIndex=0);let l=!1,u=!1,d=!1,f=()=>!a.matches&&o.matches&&l,p=e=>{let t=n.getBoundingClientRect();return[Math.max(0,Math.min(1,(e.clientX-t.left)/t.width)),Math.max(0,Math.min(1,(e.clientY-t.top)/t.height))]},m=t=>{f()&&(e||=i(),e?.enter(n,r,t))},h=e=>{e.pointerType!==`touch`&&(u=!0,m(p(e)))},g=t=>{u&&f()&&e?.move(n,p(t))},_=()=>{u=!1,d||e?.leave(n)},v=()=>{c.matches(`:focus-visible`)&&(d=!0,m([.5,.5]))},y=()=>{d=!1,u||e?.leave(n)},b=()=>{(u||d)&&m([.5,.5])},x=()=>{f()||e?.leave(n,!0)},S=new IntersectionObserver(t=>{l=t[0].isIntersecting,l||e?.leave(n,!0)},{threshold:.01});return S.observe(n),n.addEventListener(`pointerenter`,h),n.addEventListener(`pointermove`,g),n.addEventListener(`pointerleave`,_),c.addEventListener(`focus`,v),c.addEventListener(`blur`,y),r.addEventListener(`load`,b),a.addEventListener(`change`,x),o.addEventListener(`change`,x),()=>{e?.leave(n,!0),S.disconnect(),n.removeEventListener(`pointerenter`,h),n.removeEventListener(`pointermove`,g),n.removeEventListener(`pointerleave`,_),c.removeEventListener(`focus`,v),c.removeEventListener(`blur`,y),r.removeEventListener(`load`,b),a.removeEventListener(`change`,x),o.removeEventListener(`change`,x),s||n.removeAttribute(`tabindex`),t--,t||(e?.dispose(),e=null)}}export{a as mountFocusImage};