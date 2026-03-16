(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[185],{2402:function(e,t,r){"use strict";r.d(t,{Z:function(){return a}});let a=(0,r(4606).Z)("dices",[["rect",{width:"12",height:"12",x:"2",y:"10",rx:"2",ry:"2",key:"6agr2n"}],["path",{d:"m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6",key:"1o487t"}],["path",{d:"M6 18h.01",key:"uhywen"}],["path",{d:"M10 14h.01",key:"ssrbsk"}],["path",{d:"M15 6h.01",key:"cblpky"}],["path",{d:"M18 9h.01",key:"2061c0"}]])},4322:function(e,t,r){"use strict";r.d(t,{Z:function(){return a}});let a=(0,r(4606).Z)("package",[["path",{d:"M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z",key:"1a0edw"}],["path",{d:"M12 22V12",key:"d0xqtd"}],["polyline",{points:"3.29 7 12 12 20.71 7",key:"ousv84"}],["path",{d:"m7.5 4.27 9 5.15",key:"1c824w"}]])},268:function(e,t,r){"use strict";r.d(t,{Z:function(){return a}});let a=(0,r(4606).Z)("store",[["path",{d:"M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5",key:"slp6dd"}],["path",{d:"M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244",key:"o0xfot"}],["path",{d:"M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05",key:"wn3emo"}]])},7972:function(e,t,r){"use strict";r.d(t,{Z:function(){return a}});let a=(0,r(4606).Z)("user",[["path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",key:"975kel"}],["circle",{cx:"12",cy:"7",r:"4",key:"17ys0d"}]])},599:function(e,t,r){Promise.resolve().then(r.t.bind(r,2445,23)),Promise.resolve().then(r.bind(r,2592)),Promise.resolve().then(r.bind(r,6325)),Promise.resolve().then(r.bind(r,6915)),Promise.resolve().then(r.bind(r,377)),Promise.resolve().then(r.bind(r,6055)),Promise.resolve().then(r.bind(r,9116)),Promise.resolve().then(r.bind(r,2770)),Promise.resolve().then(r.t.bind(r,6087,23))},2592:function(e,t,r){"use strict";r.r(t),r.d(t,{AmapProvider:function(){return i},useAmap:function(){return n}});var a=r(7437),o=r(2265);let s=(0,o.createContext)(void 0);function i(e){let{children:t}=e,[r,i]=(0,o.useState)(!1),[n,l]=(0,o.useState)(!1);return(0,o.useEffect)(()=>{if(document.querySelector('script[src*="webapi.amap.com"]')){i(!0),window.AMap&&l(!0);return}let e=document.createElement("script");return e.src="https://webapi.amap.com/maps?v=2.0&key=68eb7700f1011a06dedbb0daabddd770",e.async=!0,e.onload=()=>{i(!0);let e=()=>{window.AMap?l(!0):setTimeout(e,100)};e()},e.onerror=()=>{console.error("Failed to load Amap script"),i(!1)},document.head.appendChild(e),()=>{}},[]),(0,a.jsx)(s.Provider,{value:{amapLoaded:r,amapReady:n},children:t})}function n(){let e=(0,o.useContext)(s);return void 0===e?{amapLoaded:!0,amapReady:!!window.AMap}:e}},6915:function(e,t,r){"use strict";r.r(t),r.d(t,{default:function(){return m}});var a=r(7437),o=r(1396),s=r.n(o),i=r(4033),n=r(6325),l=r(2770),d=r(4322),c=r(268),u=r(3733),p=r(2402),f=r(7972);function m(){let e=(0,i.usePathname)(),{user:t,loading:r}=(0,n.useAuth)(),{t:o}=(0,l.useLocale)();if(r||!t||"/login"===e||"/register"===e)return null;let m=[{href:"/inventory",labelKey:"nav.inventory",icon:d.Z},{href:"/shop",labelKey:"nav.shop",icon:c.Z},{href:"/map",labelKey:"nav.map",icon:u.Z,isCenter:!0},{href:"/gacha",labelKey:"nav.gacha",icon:p.Z},{href:"/profile",labelKey:"nav.profile",icon:f.Z}];return(0,a.jsx)("nav",{className:"fixed bottom-0 left-0 right-0 bg-white border-t-3 border-gray-200 z-50 safe-area-pb shadow-[0_-4px_20px_rgba(0,0,0,0.08)]",children:(0,a.jsx)("div",{className:"flex justify-around items-end h-16 max-w-lg mx-auto px-2",children:m.map(t=>{let r=e===t.href||e.startsWith(t.href+"/"),i=t.icon;return t.isCenter?(0,a.jsxs)(s(),{href:t.href,className:"flex flex-col items-center justify-center flex-1 touch-manipulation relative -mt-5",children:[(0,a.jsx)("div",{className:"flex items-center justify-center w-14 h-14 rounded-full border-4 shadow-lg transition-all duration-200 ".concat(r?"bg-gradient-to-br from-yellow-400 to-orange-400 border-yellow-500 scale-110":"bg-gradient-to-br from-yellow-300 to-orange-300 border-yellow-400 hover:scale-105"),children:(0,a.jsx)(i,{size:24,strokeWidth:2.5,className:"text-gray-800"})}),(0,a.jsx)("span",{className:"text-[10px] font-semibold leading-none mt-1 transition-colors ".concat(r?"text-amber-600":"text-gray-400"),children:o(t.labelKey)})]},t.href):(0,a.jsxs)(s(),{href:t.href,className:"flex flex-col items-center justify-center flex-1 h-full gap-1 touch-manipulation relative",children:[(0,a.jsxs)("div",{className:"relative flex items-center justify-center w-10 h-8 rounded-xl transition-all duration-200 ".concat(r?"bg-amber-100":"hover:bg-gray-100"),children:[(0,a.jsx)(i,{size:20,strokeWidth:r?2.5:2,className:r?"text-amber-600":"text-gray-400"}),r&&(0,a.jsx)("span",{className:"absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-500"})]}),(0,a.jsx)("span",{className:"text-[10px] font-semibold leading-none transition-colors ".concat(r?"text-amber-600":"text-gray-400"),children:o(t.labelKey)})]},t.href)})})})}},6055:function(e,t,r){"use strict";let a,o;r.r(t),r.d(t,{ToastProvider:function(){return em}});var s,i=r(7437),n=r(2265);let l={data:""},d=e=>{if("object"==typeof window){let t=(e?e.querySelector("#_goober"):window._goober)||Object.assign(document.createElement("style"),{innerHTML:" ",id:"_goober"});return t.nonce=window.__nonce__,t.parentNode||(e||document.head).appendChild(t),t.firstChild}return e||l},c=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,u=/\/\*[^]*?\*\/|  +/g,p=/\n+/g,f=(e,t)=>{let r="",a="",o="";for(let s in e){let i=e[s];"@"==s[0]?"i"==s[1]?r=s+" "+i+";":a+="f"==s[1]?f(i,s):s+"{"+f(i,"k"==s[1]?"":t)+"}":"object"==typeof i?a+=f(i,t?t.replace(/([^,])+/g,e=>s.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,t=>/&/.test(t)?t.replace(/&/g,e):e?e+" "+t:t)):s):null!=i&&(s=/^--/.test(s)?s:s.replace(/[A-Z]/g,"-$&").toLowerCase(),o+=f.p?f.p(s,i):s+":"+i+";")}return r+(t&&o?t+"{"+o+"}":o)+a},m={},h=e=>{if("object"==typeof e){let t="";for(let r in e)t+=r+h(e[r]);return t}return e},y=(e,t,r,a,o)=>{var s;let i=h(e),n=m[i]||(m[i]=(e=>{let t=0,r=11;for(;t<e.length;)r=101*r+e.charCodeAt(t++)>>>0;return"go"+r})(i));if(!m[n]){let t=i!==e?e:(e=>{let t,r,a=[{}];for(;t=c.exec(e.replace(u,""));)t[4]?a.shift():t[3]?(r=t[3].replace(p," ").trim(),a.unshift(a[0][r]=a[0][r]||{})):a[0][t[1]]=t[2].replace(p," ").trim();return a[0]})(e);m[n]=f(o?{["@keyframes "+n]:t}:t,r?"":"."+n)}let l=r&&m.g?m.g:null;return r&&(m.g=m[n]),s=m[n],l?t.data=t.data.replace(l,s):-1===t.data.indexOf(s)&&(t.data=a?s+t.data:t.data+s),n},b=(e,t,r)=>e.reduce((e,a,o)=>{let s=t[o];if(s&&s.call){let e=s(r),t=e&&e.props&&e.props.className||/^go/.test(e)&&e;s=t?"."+t:e&&"object"==typeof e?e.props?"":f(e,""):!1===e?"":e}return e+a+(null==s?"":s)},"");function g(e){let t=this||{},r=e.call?e(t.p):e;return y(r.unshift?r.raw?b(r,[].slice.call(arguments,1),t.p):r.reduce((e,r)=>Object.assign(e,r&&r.call?r(t.p):r),{}):r,d(t.target),t.g,t.o,t.k)}g.bind({g:1});let v,x,w,k=g.bind({k:1});function j(e,t){let r=this||{};return function(){let a=arguments;function o(s,i){let n=Object.assign({},s),l=n.className||o.className;r.p=Object.assign({theme:x&&x()},n),r.o=/ *go\d+/.test(l),n.className=g.apply(r,a)+(l?" "+l:""),t&&(n.ref=i);let d=e;return e[0]&&(d=n.as||e,delete n.as),w&&d[0]&&w(n),v(d,n)}return t?t(o):o}}var E=e=>"function"==typeof e,N=(e,t)=>E(e)?e(t):e,_=(a=0,()=>(++a).toString()),C=()=>{if(void 0===o&&"u">typeof window){let e=matchMedia("(prefers-reduced-motion: reduce)");o=!e||e.matches}return o},A="default",P=(e,t)=>{let{toastLimit:r}=e.settings;switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,r)};case 1:return{...e,toasts:e.toasts.map(e=>e.id===t.toast.id?{...e,...t.toast}:e)};case 2:let{toast:a}=t;return P(e,{type:e.toasts.find(e=>e.id===a.id)?1:0,toast:a});case 3:let{toastId:o}=t;return{...e,toasts:e.toasts.map(e=>e.id===o||void 0===o?{...e,dismissed:!0,visible:!1}:e)};case 4:return void 0===t.toastId?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(e=>e.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let s=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(e=>({...e,pauseDuration:e.pauseDuration+s}))}}},M=[],$={toasts:[],pausedAt:void 0,settings:{toastLimit:20}},O={},z=(e,t=A)=>{O[t]=P(O[t]||$,e),M.forEach(([e,r])=>{e===t&&r(O[t])})},D=e=>Object.keys(O).forEach(t=>z(e,t)),Z=e=>Object.keys(O).find(t=>O[t].toasts.some(t=>t.id===e)),I=(e=A)=>t=>{z(t,e)},F={blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3},L=(e={},t=A)=>{let[r,a]=(0,n.useState)(O[t]||$),o=(0,n.useRef)(O[t]);(0,n.useEffect)(()=>(o.current!==O[t]&&a(O[t]),M.push([t,a]),()=>{let e=M.findIndex(([e])=>e===t);e>-1&&M.splice(e,1)}),[t]);let s=r.toasts.map(t=>{var r,a,o;return{...e,...e[t.type],...t,removeDelay:t.removeDelay||(null==(r=e[t.type])?void 0:r.removeDelay)||(null==e?void 0:e.removeDelay),duration:t.duration||(null==(a=e[t.type])?void 0:a.duration)||(null==e?void 0:e.duration)||F[t.type],style:{...e.style,...null==(o=e[t.type])?void 0:o.style,...t.style}}});return{...r,toasts:s}},S=(e,t="blank",r)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...r,id:(null==r?void 0:r.id)||_()}),T=e=>(t,r)=>{let a=S(t,e,r);return I(a.toasterId||Z(a.id))({type:2,toast:a}),a.id},K=(e,t)=>T("blank")(e,t);K.error=T("error"),K.success=T("success"),K.loading=T("loading"),K.custom=T("custom"),K.dismiss=(e,t)=>{let r={type:3,toastId:e};t?I(t)(r):D(r)},K.dismissAll=e=>K.dismiss(void 0,e),K.remove=(e,t)=>{let r={type:4,toastId:e};t?I(t)(r):D(r)},K.removeAll=e=>K.remove(void 0,e),K.promise=(e,t,r)=>{let a=K.loading(t.loading,{...r,...null==r?void 0:r.loading});return"function"==typeof e&&(e=e()),e.then(e=>{let o=t.success?N(t.success,e):void 0;return o?K.success(o,{id:a,...r,...null==r?void 0:r.success}):K.dismiss(a),e}).catch(e=>{let o=t.error?N(t.error,e):void 0;o?K.error(o,{id:a,...r,...null==r?void 0:r.error}):K.dismiss(a)}),e};var H=1e3,R=(e,t="default")=>{let{toasts:r,pausedAt:a}=L(e,t),o=(0,n.useRef)(new Map).current,s=(0,n.useCallback)((e,t=H)=>{if(o.has(e))return;let r=setTimeout(()=>{o.delete(e),i({type:4,toastId:e})},t);o.set(e,r)},[]);(0,n.useEffect)(()=>{if(a)return;let e=Date.now(),o=r.map(r=>{if(r.duration===1/0)return;let a=(r.duration||0)+r.pauseDuration-(e-r.createdAt);if(a<0){r.visible&&K.dismiss(r.id);return}return setTimeout(()=>K.dismiss(r.id,t),a)});return()=>{o.forEach(e=>e&&clearTimeout(e))}},[r,a,t]);let i=(0,n.useCallback)(I(t),[t]),l=(0,n.useCallback)(()=>{i({type:5,time:Date.now()})},[i]),d=(0,n.useCallback)((e,t)=>{i({type:1,toast:{id:e,height:t}})},[i]),c=(0,n.useCallback)(()=>{a&&i({type:6,time:Date.now()})},[a,i]),u=(0,n.useCallback)((e,t)=>{let{reverseOrder:a=!1,gutter:o=8,defaultPosition:s}=t||{},i=r.filter(t=>(t.position||s)===(e.position||s)&&t.height),n=i.findIndex(t=>t.id===e.id),l=i.filter((e,t)=>t<n&&e.visible).length;return i.filter(e=>e.visible).slice(...a?[l+1]:[0,l]).reduce((e,t)=>e+(t.height||0)+o,0)},[r]);return(0,n.useEffect)(()=>{r.forEach(e=>{if(e.dismissed)s(e.id,e.removeDelay);else{let t=o.get(e.id);t&&(clearTimeout(t),o.delete(e.id))}})},[r,s]),{toasts:r,handlers:{updateHeight:d,startPause:l,endPause:c,calculateOffset:u}}},q=k`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,V=k`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,W=k`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,U=j("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${q} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${V} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${W} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,B=k`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,Y=j("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${B} 1s linear infinite;
`,G=k`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,J=k`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,Q=j("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${G} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${J} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,X=j("div")`
  position: absolute;
`,ee=j("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,et=k`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,er=j("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${et} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,ea=({toast:e})=>{let{icon:t,type:r,iconTheme:a}=e;return void 0!==t?"string"==typeof t?n.createElement(er,null,t):t:"blank"===r?null:n.createElement(ee,null,n.createElement(Y,{...a}),"loading"!==r&&n.createElement(X,null,"error"===r?n.createElement(U,{...a}):n.createElement(Q,{...a})))},eo=e=>`
0% {transform: translate3d(0,${-200*e}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,es=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${-150*e}%,-1px) scale(.6); opacity:0;}
`,ei=j("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,en=j("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,el=(e,t)=>{let r=e.includes("top")?1:-1,[a,o]=C()?["0%{opacity:0;} 100%{opacity:1;}","0%{opacity:1;} 100%{opacity:0;}"]:[eo(r),es(r)];return{animation:t?`${k(a)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${k(o)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}},ed=n.memo(({toast:e,position:t,style:r,children:a})=>{let o=e.height?el(e.position||t||"top-center",e.visible):{opacity:0},s=n.createElement(ea,{toast:e}),i=n.createElement(en,{...e.ariaProps},N(e.message,e));return n.createElement(ei,{className:e.className,style:{...o,...r,...e.style}},"function"==typeof a?a({icon:s,message:i}):n.createElement(n.Fragment,null,s,i))});s=n.createElement,f.p=void 0,v=s,x=void 0,w=void 0;var ec=({id:e,className:t,style:r,onHeightUpdate:a,children:o})=>{let s=n.useCallback(t=>{if(t){let r=()=>{a(e,t.getBoundingClientRect().height)};r(),new MutationObserver(r).observe(t,{subtree:!0,childList:!0,characterData:!0})}},[e,a]);return n.createElement("div",{ref:s,className:t,style:r},o)},eu=(e,t)=>{let r=e.includes("top"),a=e.includes("center")?{justifyContent:"center"}:e.includes("right")?{justifyContent:"flex-end"}:{};return{left:0,right:0,display:"flex",position:"absolute",transition:C()?void 0:"all 230ms cubic-bezier(.21,1.02,.73,1)",transform:`translateY(${t*(r?1:-1)}px)`,...r?{top:0}:{bottom:0},...a}},ep=g`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`,ef=({reverseOrder:e,position:t="top-center",toastOptions:r,gutter:a,children:o,toasterId:s,containerStyle:i,containerClassName:l})=>{let{toasts:d,handlers:c}=R(r,s);return n.createElement("div",{"data-rht-toaster":s||"",style:{position:"fixed",zIndex:9999,top:16,left:16,right:16,bottom:16,pointerEvents:"none",...i},className:l,onMouseEnter:c.startPause,onMouseLeave:c.endPause},d.map(r=>{let s=r.position||t,i=eu(s,c.calculateOffset(r,{reverseOrder:e,gutter:a,defaultPosition:t}));return n.createElement(ec,{id:r.id,key:r.id,onHeightUpdate:c.updateHeight,className:r.visible?ep:"",style:i},"custom"===r.type?N(r.message,r):o?o(r):n.createElement(ed,{toast:r,position:s}))}))};function em(e){let{children:t}=e;return(0,i.jsxs)(i.Fragment,{children:[t,(0,i.jsx)(ef,{position:"top-center",toastOptions:{style:{background:"#1a1a2e",color:"#fff",border:"1px solid #333"},success:{iconTheme:{primary:"#ffd700",secondary:"#1a1a2e"}}}})]})}},2445:function(){},6087:function(e){e.exports={style:{fontFamily:"'__Inter_f367f3', '__Inter_Fallback_f367f3'",fontStyle:"normal"},className:"__className_f367f3"}}},function(e){e.O(0,[515,374,971,938,744],function(){return e(e.s=599)}),_N_E=e.O()}]);