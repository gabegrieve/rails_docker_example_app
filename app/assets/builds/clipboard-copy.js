var i=(t,e)=>()=>(e||t((e={exports:{}}).exports,e),e.exports);var w=i((y,a)=>{a.exports=s;function n(){return new DOMException("The request is not allowed","NotAllowedError")}async function l(t){if(!navigator.clipboard)throw n();return navigator.clipboard.writeText(t)}async function d(t){let e=document.createElement("span");e.textContent=t,e.style.whiteSpace="pre",e.style.webkitUserSelect="auto",e.style.userSelect="all",document.body.appendChild(e);let o=window.getSelection(),c=window.document.createRange();o.removeAllRanges(),c.selectNode(e),o.addRange(c);let r=!1;try{r=window.document.execCommand("copy")}finally{o.removeAllRanges(),window.document.body.removeChild(e)}if(!r)throw n()}async function s(t){try{await l(t)}catch(e){try{await d(t)}catch(o){throw o||e||n()}}}});export default w();
/*! Bundled license information:

clipboard-copy/index.js:
  (*! clipboard-copy. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> *)
*/
