import{a as m,j as s}from"./app-CTr4eIsy.js";const h="https://hometutor.com.my/main/simpana/images/",f="https://asset.cloudhub.my/files/simpana/images/",b='<span data-image-zoom-trigger role="button" aria-label="Zoom image" title="Zoom image"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M11 8v6M8 11h6"/></svg></span>',x=`
img[data-zoomable] { cursor: zoom-in; }
button img[data-zoomable], [role="button"] img[data-zoomable] { cursor: inherit; }
[data-image-zoom-trigger] { display: none; }
button [data-image-zoom-trigger] {
    display: inline-flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; margin: 0 4px; vertical-align: middle; flex-shrink: 0;
    border-radius: 9999px; background: rgba(15, 23, 42, .75); color: #fff; cursor: zoom-in;
}
button [data-image-zoom-trigger]:hover { background: rgba(15, 23, 42, .9); }
[data-image-zoom-overlay] {
    position: fixed; inset: 0; z-index: 2147483000; display: flex; align-items: center; justify-content: center;
    padding: 16px; background: rgba(15, 23, 42, .85); overflow: auto; cursor: zoom-out;
}
[data-image-zoom-overlay] img {
    max-width: 95vw; max-height: 88vh; object-fit: contain; border-radius: 12px;
    background: #fff; padding: 8px; box-shadow: 0 20px 50px rgba(0, 0, 0, .4); cursor: zoom-in;
}
[data-image-zoom-overlay][data-zoomed] { align-items: flex-start; justify-content: flex-start; }
[data-image-zoom-overlay][data-zoomed] img { max-width: none; max-height: none; margin: auto; cursor: zoom-out; }
[data-image-zoom-close] {
    position: fixed; top: 12px; right: 12px; width: 40px; height: 40px; border-radius: 9999px; border: 0;
    background: rgba(255, 255, 255, .95); color: #0f172a; font-size: 24px; line-height: 1; cursor: pointer;
}
`,y=e=>{if(!(e!=null&&e.startsWith(h)))return null;const t=e.split("/").pop(),o=t==null?void 0:t.match(/^(\d{6})-/);return o?`${f}${o[1].split("").join("/")}/${t}`:null},g=e=>{if(!e||e.dataset.legacyBackupTried==="true")return!1;const t=y(e.currentSrc||e.src);return t?(e.dataset.legacyBackupTried="true",e.src=t,!0):!1},d=()=>{var e;(e=document.querySelector("[data-image-zoom-overlay]"))==null||e.remove(),document.removeEventListener("keydown",p)};function p(e){e.key==="Escape"&&d()}const u=e=>{d();const t=document.createElement("div");t.dataset.imageZoomOverlay="",t.setAttribute("role","dialog"),t.setAttribute("aria-modal","true");const o=document.createElement("img");o.src=e.currentSrc||e.src,o.alt=e.alt||"Question image";const a=document.createElement("button");a.type="button",a.dataset.imageZoomClose="",a.setAttribute("aria-label","Close"),a.textContent="×";let r=0;const n=()=>{const i=Math.min(window.innerWidth*.9/o.naturalWidth,window.innerHeight*.85/o.naturalHeight,4);r=Math.round(o.naturalWidth*i),o.style.width=`${r}px`};o.addEventListener("load",n),o.addEventListener("click",i=>{i.stopPropagation(),t.hasAttribute("data-zoomed")?(t.removeAttribute("data-zoomed"),o.style.width=`${r}px`):(t.setAttribute("data-zoomed",""),o.style.width=`${r*2}px`)}),t.addEventListener("click",d),t.append(o,a),document.body.appendChild(t),document.addEventListener("keydown",p)};if(typeof document<"u"&&!window.__questionImageListenersAdded){const e=document.createElement("style");e.textContent=x,document.head.appendChild(e),document.addEventListener("error",t=>{t.target instanceof HTMLImageElement&&g(t.target)},!0),document.addEventListener("click",t=>{var r,n,i,c;const o=(n=(r=t.target).closest)==null?void 0:n.call(r,"[data-image-zoom-trigger]");if(o){const l=o.previousElementSibling;l instanceof HTMLImageElement&&(t.preventDefault(),t.stopPropagation(),u(l));return}const a=(c=(i=t.target).closest)==null?void 0:c.call(i,"img[data-zoomable]");a&&!a.closest('button, [role="button"]')&&(t.preventDefault(),t.stopPropagation(),u(a))},!0),window.__questionImageListenersAdded=!0}const v=e=>e&&e.replace(/<img\b([^>]*?\bsrc\s*=\s*(["'])[^"']+\2[^>]*)>/gi,(t,o)=>`<img data-zoomable${o}>${b}`);function E({path:e}){const t=m.useRef(null);return m.useEffect(()=>{var a;const o=(a=t.current)==null?void 0:a.previousElementSibling;o instanceof HTMLImageElement&&(o.dataset.zoomable="",o.complete&&o.naturalWidth===0&&g(o))},[e]),e?s.jsx("span",{ref:t,"data-image-zoom-trigger":!0,role:"button","aria-label":"Zoom image",title:"Zoom image",children:s.jsxs("svg",{viewBox:"0 0 24 24",width:"14",height:"14",fill:"none",stroke:"currentColor",strokeWidth:"2.2",strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":"true",children:[s.jsx("circle",{cx:"11",cy:"11",r:"7"}),s.jsx("path",{d:"m20 20-3.5-3.5M11 8v6M8 11h6"})]})}):null}export{E as I,v as a};
