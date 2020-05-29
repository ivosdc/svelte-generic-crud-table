var app=function(){"use strict";function e(){}function t(e,t){for(const n in t)e[n]=t[n];return e}function n(e){return e()}function l(){return Object.create(null)}function i(e){e.forEach(n)}function o(e){return"function"==typeof e}function s(e,t){return e!=e?t==t:e!==t||e&&"object"==typeof e||"function"==typeof e}function c(e){const t={};for(const n in e)"$"!==n[0]&&(t[n]=e[n]);return t}function a(e){return null==e?"":e}function d(e,t){e.appendChild(t)}function r(e,t,n){e.insertBefore(t,n||null)}function u(e){e.parentNode.removeChild(e)}function f(e,t){for(let n=0;n<e.length;n+=1)e[n]&&e[n].d(t)}function m(e){return document.createElement(e)}function h(e){return document.createElementNS("http://www.w3.org/2000/svg",e)}function p(e){return document.createTextNode(e)}function g(){return p(" ")}function y(){return p("")}function $(e,t,n,l){return e.addEventListener(t,n,l),()=>e.removeEventListener(t,n,l)}function v(e,t,n){null==n?e.removeAttribute(t):e.getAttribute(t)!==n&&e.setAttribute(t,n)}function b(e,t){t=""+t,e.data!==t&&(e.data=t)}let w;function E(e){w=e}function L(){const e=function(){if(!w)throw new Error("Function called outside component initialization");return w}();return(t,n)=>{const l=e.$$.callbacks[t];if(l){const i=function(e,t){const n=document.createEvent("CustomEvent");return n.initCustomEvent(e,!1,!1,t),n}(t,n);l.slice().forEach(t=>{t.call(e,i)})}}}const _=[],x=[],C=[],B=[],I=Promise.resolve();let S=!1;function K(e){C.push(e)}let M=!1;const N=new Set;function A(){if(!M){M=!0;do{for(let e=0;e<_.length;e+=1){const t=_[e];E(t),O(t.$$)}for(_.length=0;x.length;)x.pop()();for(let e=0;e<C.length;e+=1){const t=C[e];N.has(t)||(N.add(t),t())}C.length=0}while(_.length);for(;B.length;)B.pop()();S=!1,M=!1,N.clear()}}function O(e){if(null!==e.fragment){e.update(),i(e.before_update);const t=e.dirty;e.dirty=[-1],e.fragment&&e.fragment.p(e.ctx,t),e.after_update.forEach(K)}}const k=new Set;let D;function T(){D={r:0,c:[],p:D}}function H(){D.r||i(D.c),D=D.p}function V(e,t){e&&e.i&&(k.delete(e),e.i(t))}function j(e,t,n,l){if(e&&e.o){if(k.has(e))return;k.add(e),D.c.push(()=>{k.delete(e),l&&(n&&e.d(1),l())}),e.o(t)}}function z(e){e&&e.c()}function F(e,t,l){const{fragment:s,on_mount:c,on_destroy:a,after_update:d}=e.$$;s&&s.m(t,l),K(()=>{const t=c.map(n).filter(o);a?a.push(...t):i(t),e.$$.on_mount=[]}),d.forEach(K)}function U(e,t){const n=e.$$;null!==n.fragment&&(i(n.on_destroy),n.fragment&&n.fragment.d(t),n.on_destroy=n.fragment=null,n.ctx=[])}function J(e,t){-1===e.$$.dirty[0]&&(_.push(e),S||(S=!0,I.then(A)),e.$$.dirty.fill(0)),e.$$.dirty[t/31|0]|=1<<t%31}function R(t,n,o,s,c,a,d=[-1]){const r=w;E(t);const f=n.props||{},m=t.$$={fragment:null,ctx:null,props:a,update:e,not_equal:c,bound:l(),on_mount:[],on_destroy:[],before_update:[],after_update:[],context:new Map(r?r.$$.context:[]),callbacks:l(),dirty:d};let h=!1;if(m.ctx=o?o(t,f,(e,n,...l)=>{const i=l.length?l[0]:n;return m.ctx&&c(m.ctx[e],m.ctx[e]=i)&&(m.bound[e]&&m.bound[e](i),h&&J(t,e)),n}):[],m.update(),h=!0,i(m.before_update),m.fragment=!!s&&s(m.ctx),n.target){if(n.hydrate){const e=function(e){return Array.from(e.childNodes)}(n.target);m.fragment&&m.fragment.l(e),e.forEach(u)}else m.fragment&&m.fragment.c();n.intro&&V(t.$$.fragment),F(t,n.target,n.anchor),A()}E(r)}class W{$destroy(){U(this,1),this.$destroy=e}$on(e,t){const n=this.$$.callbacks[e]||(this.$$.callbacks[e]=[]);return n.push(t),()=>{const e=n.indexOf(t);-1!==e&&n.splice(e,1)}}$set(){}}function G(t){let n,l,i;return{c(){n=h("svg"),l=h("path"),v(l,"fill","currentColor"),v(l,"d",t[0]),v(n,"aria-hidden","true"),v(n,"class",i=a(t[1])+" svelte-p8vizn"),v(n,"role","img"),v(n,"xmlns","http://www.w3.org/2000/svg"),v(n,"viewBox",t[2])},m(e,t){r(e,n,t),d(n,l)},p(e,[t]){1&t&&v(l,"d",e[0]),2&t&&i!==(i=a(e[1])+" svelte-p8vizn")&&v(n,"class",i),4&t&&v(n,"viewBox",e[2])},i:e,o:e,d(e){e&&u(n)}}}function q(e,n,l){let{icon:i}=n,o=[],s="",a="";return e.$set=e=>{l(4,n=t(t({},n),c(e))),"icon"in e&&l(3,i=e.icon)},e.$$.update=()=>{8&e.$$.dirty&&l(2,a="0 0 "+i.icon[0]+" "+i.icon[1]),l(1,s="fa-svelte "+(n.class?n.class:"")),8&e.$$.dirty&&l(0,o=i.icon[4])},n=c(n),[o,s,a,i]}class P extends W{constructor(e){super(),R(this,e,q,G,s,{icon:3})}}var Q={prefix:"fas",iconName:"edit",icon:[576,512,[],"f044","M402.6 83.2l90.2 90.2c3.8 3.8 3.8 10 0 13.8L274.4 405.6l-92.8 10.3c-12.4 1.4-22.9-9.1-21.5-21.5l10.3-92.8L388.8 83.2c3.8-3.8 10-3.8 13.8 0zm162-22.9l-48.8-48.8c-15.2-15.2-39.9-15.2-55.2 0l-35.4 35.4c-3.8 3.8-3.8 10 0 13.8l90.2 90.2c3.8 3.8 10 3.8 13.8 0l35.4-35.4c15.2-15.3 15.2-40 0-55.2zM384 346.2V448H64V128h229.8c3.2 0 6.2-1.3 8.5-3.5l40-40c7.6-7.6 2.2-20.5-8.5-20.5H48C21.5 64 0 85.5 0 112v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V306.2c0-10.7-12.9-16-20.5-8.5l-40 40c-2.2 2.3-3.5 5.3-3.5 8.5z"]},X={prefix:"fas",iconName:"info",icon:[192,512,[],"f129","M20 424.229h20V279.771H20c-11.046 0-20-8.954-20-20V212c0-11.046 8.954-20 20-20h112c11.046 0 20 8.954 20 20v212.229h20c11.046 0 20 8.954 20 20V492c0 11.046-8.954 20-20 20H20c-11.046 0-20-8.954-20-20v-47.771c0-11.046 8.954-20 20-20zM96 0C56.235 0 24 32.235 24 72s32.235 72 72 72 72-32.235 72-72S135.764 0 96 0z"]},Y={prefix:"fas",iconName:"paper-plane",icon:[512,512,[],"f1d8","M476 3.2L12.5 270.6c-18.1 10.4-15.8 35.6 2.2 43.2L121 358.4l287.3-253.2c5.5-4.9 13.3 2.6 8.6 8.3L176 407v80.5c0 23.6 28.5 32.9 42.5 15.8L282 426l124.6 52.2c14.2 6 30.4-2.9 33-18.2l72-432C515 7.8 493.3-6.8 476 3.2z"]},Z={prefix:"fas",iconName:"plus",icon:[448,512,[],"f067","M416 208H272V64c0-17.67-14.33-32-32-32h-32c-17.67 0-32 14.33-32 32v144H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h144v144c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32V304h144c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z"]},ee={prefix:"fas",iconName:"times",icon:[352,512,[],"f00d","M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"]},te={prefix:"fas",iconName:"trash",icon:[448,512,[],"f1f8","M432 32H312l-9.4-18.7A24 24 0 0 0 281.1 0H166.8a23.72 23.72 0 0 0-21.4 13.3L136 32H16A16 16 0 0 0 0 48v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16zM53.2 467a48 48 0 0 0 47.9 45h245.8a48 48 0 0 0 47.9-45L416 128H32z"]};class ne{constructor(e,t,n){this.name=e,this.editable_fields=t,this.show_fields=n}getKey(e){return e[0]}makeCapitalLead(e){return e[0].toUpperCase()+e.substr(1)}getValue(e){return e[1]}resetEditMode(e){this.editable_fields.forEach(t=>{document.getElementById(this.name+t+e).setAttribute("disabled","true")}),document.getElementById(this.name+"options-default"+e).classList.remove("hidden"),document.getElementById(this.name+"options-default"+e).classList.add("shown"),document.getElementById(this.name+"options-edit"+e).classList.remove("shown"),document.getElementById(this.name+"options-edit"+e).classList.add("hidden")}resetDeleteMode(e){document.getElementById(this.name+"options-default"+e).classList.remove("hidden"),document.getElementById(this.name+"options-default"+e).classList.add("shown"),document.getElementById(this.name+"options-delete"+e).classList.remove("shown"),document.getElementById(this.name+"options-delete"+e).classList.add("hidden")}setEditMode(e){this.editable_fields.forEach(t=>{document.getElementById(this.name+t+e).removeAttribute("disabled")}),document.getElementById(this.name+"options-default"+e).classList.add("hidden"),document.getElementById(this.name+"options-default"+e).classList.remove("shown"),document.getElementById(this.name+"options-edit"+e).classList.remove("hidden"),document.getElementById(this.name+"options-edit"+e).classList.add("shown")}setDeleteMode(e){document.getElementById(this.name+"options-default"+e).classList.add("hidden"),document.getElementById(this.name+"options-default"+e).classList.remove("shown"),document.getElementById(this.name+"options-delete"+e).classList.remove("hidden"),document.getElementById(this.name+"options-delete"+e).classList.add("shown")}gatherUpdates(e,t){const n={};return Object.entries(t[0]).forEach(t=>{n[this.getKey(t)]=document.getElementById(this.name+this.getKey(t)+e).value}),n}isShowField(e){let t=!1;return 0===this.show_fields.length&&(t=!0),this.show_fields.forEach(n=>{Object.keys(n)[0]===e&&(t=!0)}),t}getShowFieldWidth(e){let t="";return this.show_fields.forEach(n=>{Object.keys(n)[0]===e&&(t=n[e])}),t}}function le(e,t,n){const l=e.slice();return l[37]=t[n],l[39]=n,l}function ie(e,t,n){const l=e.slice();return l[37]=t[n],l}function oe(e,t,n){const l=e.slice();return l[34]=t[n],l[36]=n,l}function se(e){let t,n,l,i,o;const s=[ae,ce],c=[];function a(e,n){return 1&n[0]&&(t=!!Array.isArray(e[0])),t?0:1}return n=a(e,[-1]),l=c[n]=s[n](e),{c(){l.c(),i=y()},m(e,t){c[n].m(e,t),r(e,i,t),o=!0},p(e,t){let o=n;n=a(e,t),n===o?c[n].p(e,t):(T(),j(c[o],1,1,()=>{c[o]=null}),H(),l=c[n],l||(l=c[n]=s[n](e),l.c()),V(l,1),l.m(i.parentNode,i))},i(e){o||(V(l),o=!0)},o(e){j(l),o=!1},d(e){c[n].d(e),e&&u(i)}}}function ce(t){let n,l=JSON.stringify(t[0])+"";return{c(){n=p(l)},m(e,t){r(e,n,t)},p(e,t){1&t[0]&&l!==(l=JSON.stringify(e[0])+"")&&b(n,l)},i:e,o:e,d(e){e&&u(n)}}}function ae(e){let t,n,l,i,o=e[2].includes(Ee),s=e[0],c=[];for(let t=0;t<s.length;t+=1)c[t]=ye(oe(e,s,t));const a=e=>j(c[e],1,1,()=>{c[e]=null});let d=o&&$e(e);return{c(){t=m("table");for(let e=0;e<c.length;e+=1)c[e].c();n=g(),d&&d.c(),l=y(),v(t,"class","svelte-1ua0edh")},m(e,o){r(e,t,o);for(let e=0;e<c.length;e+=1)c[e].m(t,null);r(e,n,o),d&&d.m(e,o),r(e,l,o),i=!0},p(e,n){if(458495&n[0]){let l;for(s=e[0],l=0;l<s.length;l+=1){const i=oe(e,s,l);c[l]?(c[l].p(i,n),V(c[l],1)):(c[l]=ye(i),c[l].c(),V(c[l],1),c[l].m(t,null))}for(T(),l=s.length;l<c.length;l+=1)a(l);H()}4&n[0]&&(o=e[2].includes(Ee)),o?d?(d.p(e,n),4&n[0]&&V(d,1)):(d=$e(e),d.c(),V(d,1),d.m(l.parentNode,l)):d&&(T(),j(d,1,1,()=>{d=null}),H())},i(e){if(!i){for(let e=0;e<s.length;e+=1)V(c[e]);V(d),i=!0}},o(e){c=c.filter(Boolean);for(let e=0;e<c.length;e+=1)j(c[e]);j(d),i=!1},d(e){e&&u(t),f(c,e),e&&u(n),d&&d.d(e),e&&u(l)}}}function de(e){let t,n,l,i,o,s;function c(...t){return e[26](e[37],...t)}return{c(){t=m("td"),n=m("textarea"),v(n,"class","sortable svelte-1ua0edh"),n.value=l=e[9].makeCapitalLead(e[37]),n.disabled=!0,v(t,"class",i="headline "+(!1===e[9].isShowField(e[37])?"hidden":"shown")+" svelte-1ua0edh"),v(t,"width",o=e[9].getShowFieldWidth(e[37]))},m(e,l,i){r(e,t,l),d(t,n),i&&s(),s=$(t,"click",c)},p(s,c){e=s,1&c[0]&&l!==(l=e[9].makeCapitalLead(e[37]))&&(n.value=l),1&c[0]&&i!==(i="headline "+(!1===e[9].isShowField(e[37])?"hidden":"shown")+" svelte-1ua0edh")&&v(t,"class",i),1&c[0]&&o!==(o=e[9].getShowFieldWidth(e[37]))&&v(t,"width",o)},d(e){e&&u(t),s()}}}function re(e){let t,n,l,i,o,s,c,a,f,h,p,y,$,b,w=e[2].includes(we),E=e[2].includes(be),L=e[2].includes(Le),_=e[2].includes(be),x=e[2].includes(we),C=w&&ue(e),B=E&&fe(e),I=L&&me(e),S=_&&he(e),K=x&&pe(e);return{c(){t=m("td"),n=m("div"),C&&C.c(),l=g(),B&&B.c(),i=g(),I&&I.c(),c=g(),a=m("div"),S&&S.c(),h=g(),p=m("div"),K&&K.c(),v(n,"id",o=e[1]+"options-default"+e[36]),v(n,"aria-label",s=e[1]+"options-default"+e[36]),v(n,"class","options shown svelte-1ua0edh"),v(a,"id",f=e[1]+"options-edit"+e[36]),v(a,"class","options hidden svelte-1ua0edh"),v(p,"id",y=e[1]+"options-delete"+e[36]),v(p,"aria-label",$=e[1]+"options-delete"+e[36]),v(p,"class","options hidden svelte-1ua0edh"),v(t,"class","svelte-1ua0edh")},m(e,o){r(e,t,o),d(t,n),C&&C.m(n,null),d(n,l),B&&B.m(n,null),d(n,i),I&&I.m(n,null),d(t,c),d(t,a),S&&S.m(a,null),d(t,h),d(t,p),K&&K.m(p,null),b=!0},p(e,t){4&t[0]&&(w=e[2].includes(we)),w?C?(C.p(e,t),4&t[0]&&V(C,1)):(C=ue(e),C.c(),V(C,1),C.m(n,l)):C&&(T(),j(C,1,1,()=>{C=null}),H()),4&t[0]&&(E=e[2].includes(be)),E?B?(B.p(e,t),4&t[0]&&V(B,1)):(B=fe(e),B.c(),V(B,1),B.m(n,i)):B&&(T(),j(B,1,1,()=>{B=null}),H()),4&t[0]&&(L=e[2].includes(Le)),L?I?(I.p(e,t),4&t[0]&&V(I,1)):(I=me(e),I.c(),V(I,1),I.m(n,null)):I&&(T(),j(I,1,1,()=>{I=null}),H()),(!b||2&t[0]&&o!==(o=e[1]+"options-default"+e[36]))&&v(n,"id",o),(!b||2&t[0]&&s!==(s=e[1]+"options-default"+e[36]))&&v(n,"aria-label",s),4&t[0]&&(_=e[2].includes(be)),_?S?(S.p(e,t),4&t[0]&&V(S,1)):(S=he(e),S.c(),V(S,1),S.m(a,null)):S&&(T(),j(S,1,1,()=>{S=null}),H()),(!b||2&t[0]&&f!==(f=e[1]+"options-edit"+e[36]))&&v(a,"id",f),4&t[0]&&(x=e[2].includes(we)),x?K?(K.p(e,t),4&t[0]&&V(K,1)):(K=pe(e),K.c(),V(K,1),K.m(p,null)):K&&(T(),j(K,1,1,()=>{K=null}),H()),(!b||2&t[0]&&y!==(y=e[1]+"options-delete"+e[36]))&&v(p,"id",y),(!b||2&t[0]&&$!==($=e[1]+"options-delete"+e[36]))&&v(p,"aria-label",$)},i(e){b||(V(C),V(B),V(I),V(S),V(K),b=!0)},o(e){j(C),j(B),j(I),j(S),j(K),b=!1},d(e){e&&u(t),C&&C.d(),B&&B.d(),I&&I.d(),S&&S.d(),K&&K.d()}}}function ue(e){let t,n,l,i;const o=new P({props:{icon:e[3]}});function s(...t){return e[27](e[36],...t)}return{c(){t=m("div"),z(o.$$.fragment),v(t,"class","options red svelte-1ua0edh"),v(t,"title","Delete"),v(t,"aria-label",n=e[1]+e[9].getKey(e[37])+e[36]+"delete")},m(e,n,c){r(e,t,n),F(o,t,null),l=!0,c&&i(),i=$(t,"click",s)},p(i,o){e=i,(!l||3&o[0]&&n!==(n=e[1]+e[9].getKey(e[37])+e[36]+"delete"))&&v(t,"aria-label",n)},i(e){l||(V(o.$$.fragment,e),l=!0)},o(e){j(o.$$.fragment,e),l=!1},d(e){e&&u(t),U(o),i()}}}function fe(e){let t,n,l;const i=new P({props:{icon:e[4]}});function o(...t){return e[28](e[36],...t)}return{c(){t=m("div"),z(i.$$.fragment),v(t,"class","options green svelte-1ua0edh"),v(t,"title","Edit")},m(e,s,c){r(e,t,s),F(i,t,null),n=!0,c&&l(),l=$(t,"click",o)},p(t,n){e=t},i(e){n||(V(i.$$.fragment,e),n=!0)},o(e){j(i.$$.fragment,e),n=!1},d(e){e&&u(t),U(i),l()}}}function me(e){let t,n,l;const i=new P({props:{icon:e[7]}});function o(...t){return e[29](e[36],...t)}return{c(){t=m("div"),z(i.$$.fragment),v(t,"class","options blue svelte-1ua0edh"),v(t,"title","Details")},m(e,s,c){r(e,t,s),F(i,t,null),n=!0,c&&l(),l=$(t,"click",o)},p(t,n){e=t},i(e){n||(V(i.$$.fragment,e),n=!0)},o(e){j(i.$$.fragment,e),n=!1},d(e){e&&u(t),U(i),l()}}}function he(e){let t,n,l,o,s,c;const a=new P({props:{icon:e[5]}});function d(...t){return e[30](e[36],...t)}const f=new P({props:{icon:e[6]}});function h(...t){return e[31](e[36],...t)}return{c(){t=m("div"),z(a.$$.fragment),n=g(),l=m("div"),z(f.$$.fragment),v(t,"class","options green svelte-1ua0edh"),v(t,"title","Update"),v(l,"class","options red svelte-1ua0edh"),v(l,"title","Cancel"),v(l,"aria-label",o=e[1]+e[9].getKey(e[37])+e[36]+"editCancel")},m(e,o,u){r(e,t,o),F(a,t,null),r(e,n,o),r(e,l,o),F(f,l,null),s=!0,u&&i(c),c=[$(t,"click",d),$(l,"click",h)]},p(t,n){e=t,(!s||3&n[0]&&o!==(o=e[1]+e[9].getKey(e[37])+e[36]+"editCancel"))&&v(l,"aria-label",o)},i(e){s||(V(a.$$.fragment,e),V(f.$$.fragment,e),s=!0)},o(e){j(a.$$.fragment,e),j(f.$$.fragment,e),s=!1},d(e){e&&u(t),U(a),e&&u(n),e&&u(l),U(f),i(c)}}}function pe(e){let t,n,l,o,s,c,a;const d=new P({props:{icon:e[5]}});function f(...t){return e[32](e[36],...t)}const h=new P({props:{icon:e[6]}});function p(...t){return e[33](e[36],...t)}return{c(){t=m("div"),z(d.$$.fragment),l=g(),o=m("div"),z(h.$$.fragment),v(t,"class","options green svelte-1ua0edh"),v(t,"title","Delete"),v(t,"aria-label",n=e[1]+e[9].getKey(e[37])+e[36]+"deleteConfirmation"),v(o,"class","options red svelte-1ua0edh"),v(o,"title","Cancel"),v(o,"aria-label",s=e[1]+e[9].getKey(e[37])+e[36]+"deleteCancel")},m(e,n,s){r(e,t,n),F(d,t,null),r(e,l,n),r(e,o,n),F(h,o,null),c=!0,s&&i(a),a=[$(t,"click",f),$(o,"click",p)]},p(l,i){e=l,(!c||3&i[0]&&n!==(n=e[1]+e[9].getKey(e[37])+e[36]+"deleteConfirmation"))&&v(t,"aria-label",n),(!c||3&i[0]&&s!==(s=e[1]+e[9].getKey(e[37])+e[36]+"deleteCancel"))&&v(o,"aria-label",s)},i(e){c||(V(d.$$.fragment,e),V(h.$$.fragment,e),c=!0)},o(e){j(d.$$.fragment,e),j(h.$$.fragment,e),c=!1},d(e){e&&u(t),U(d),e&&u(l),e&&u(o),U(h),i(a)}}}function ge(e){let t,n,l,i,o,s,c,f,h,$,w,E,L,_,x,C=e[9].getValue(e[37])+"",B=Object.entries(e[34]).length-1===e[39],I=B&&re(e);return{c(){t=m("td"),n=m("textarea"),s=g(),c=m("div"),f=p(C),L=g(),I&&I.c(),_=y(),v(n,"id",l=""+(e[1]+e[9].getKey(e[37])+e[36])),v(n,"aria-label",i=""+(e[1]+e[9].getKey(e[37])+e[36])),n.value=o=e[9].getValue(e[37]),n.disabled=!0,v(n,"class","svelte-1ua0edh"),v(c,"class","hidden svelte-1ua0edh"),v(c,"id",h=e[1]+e[9].getKey(e[37])+e[36]+"copy"),v(c,"aria-label",$=e[1]+e[9].getKey(e[37])+e[36]+"copy"),v(t,"class",w=a(!1===e[9].isShowField(e[9].getKey(e[37]))?"hidden":"shown")+" svelte-1ua0edh"),v(t,"width",E=e[9].getShowFieldWidth(e[9].getKey(e[37])))},m(e,l){r(e,t,l),d(t,n),d(t,s),d(t,c),d(c,f),r(e,L,l),I&&I.m(e,l),r(e,_,l),x=!0},p(e,s){(!x||3&s[0]&&l!==(l=""+(e[1]+e[9].getKey(e[37])+e[36])))&&v(n,"id",l),(!x||3&s[0]&&i!==(i=""+(e[1]+e[9].getKey(e[37])+e[36])))&&v(n,"aria-label",i),(!x||1&s[0]&&o!==(o=e[9].getValue(e[37])))&&(n.value=o),(!x||1&s[0])&&C!==(C=e[9].getValue(e[37])+"")&&b(f,C),(!x||3&s[0]&&h!==(h=e[1]+e[9].getKey(e[37])+e[36]+"copy"))&&v(c,"id",h),(!x||3&s[0]&&$!==($=e[1]+e[9].getKey(e[37])+e[36]+"copy"))&&v(c,"aria-label",$),(!x||1&s[0]&&w!==(w=a(!1===e[9].isShowField(e[9].getKey(e[37]))?"hidden":"shown")+" svelte-1ua0edh"))&&v(t,"class",w),(!x||1&s[0]&&E!==(E=e[9].getShowFieldWidth(e[9].getKey(e[37]))))&&v(t,"width",E),1&s[0]&&(B=Object.entries(e[34]).length-1===e[39]),B?I?(I.p(e,s),1&s[0]&&V(I,1)):(I=re(e),I.c(),V(I,1),I.m(_.parentNode,_)):I&&(T(),j(I,1,1,()=>{I=null}),H())},i(e){x||(V(I),x=!0)},o(e){j(I),x=!1},d(e){e&&u(t),e&&u(L),I&&I.d(e),e&&u(_)}}}function ye(e){let t,n,l,i,o=0===e[36]&&function(e){let t,n,l,i=Object.keys(e[34]),o=[];for(let t=0;t<i.length;t+=1)o[t]=de(ie(e,i,t));return{c(){t=m("tr");for(let e=0;e<o.length;e+=1)o[e].c();n=g(),l=m("td"),l.innerHTML='<textarea value="" disabled="" class="svelte-1ua0edh"></textarea>',v(l,"id","labelOptions"),v(l,"class","headline svelte-1ua0edh")},m(e,i){r(e,t,i);for(let e=0;e<o.length;e+=1)o[e].m(t,null);d(t,n),d(t,l)},p(e,l){if(262657&l[0]){let s;for(i=Object.keys(e[34]),s=0;s<i.length;s+=1){const c=ie(e,i,s);o[s]?o[s].p(c,l):(o[s]=de(c),o[s].c(),o[s].m(t,n))}for(;s<o.length;s+=1)o[s].d(1);o.length=i.length}},d(e){e&&u(t),f(o,e)}}}(e),s=Object.entries(e[34]),c=[];for(let t=0;t<s.length;t+=1)c[t]=ge(le(e,s,t));const a=e=>j(c[e],1,1,()=>{c[e]=null});return{c(){o&&o.c(),t=g(),n=m("tr");for(let e=0;e<c.length;e+=1)c[e].c();l=g(),v(n,"class","row svelte-1ua0edh")},m(e,s){o&&o.m(e,s),r(e,t,s),r(e,n,s);for(let e=0;e<c.length;e+=1)c[e].m(n,null);d(n,l),i=!0},p(e,t){if(0===e[36]&&o.p(e,t),196351&t[0]){let i;for(s=Object.entries(e[34]),i=0;i<s.length;i+=1){const o=le(e,s,i);c[i]?(c[i].p(o,t),V(c[i],1)):(c[i]=ge(o),c[i].c(),V(c[i],1),c[i].m(n,l))}for(T(),i=s.length;i<c.length;i+=1)a(i);H()}},i(e){if(!i){for(let e=0;e<s.length;e+=1)V(c[e]);i=!0}},o(e){c=c.filter(Boolean);for(let e=0;e<c.length;e+=1)j(c[e]);i=!1},d(e){o&&o.d(e),e&&u(t),e&&u(n),f(c,e)}}}function $e(t){let n,l,i,o,s,c;const a=new P({props:{icon:t[8]}});return{c(){n=m("div"),z(a.$$.fragment),l=g(),i=m("br"),o=m("br"),v(n,"class","options svelte-1ua0edh"),v(n,"id","options-create"),v(n,"title","Create")},m(e,d,u){r(e,n,d),F(a,n,null),r(e,l,d),r(e,i,d),r(e,o,d),s=!0,u&&c(),c=$(n,"click",t[16])},p:e,i(e){s||(V(a.$$.fragment,e),s=!0)},o(e){j(a.$$.fragment,e),s=!1},d(e){e&&u(n),U(a),e&&u(l),e&&u(i),e&&u(o),c()}}}function ve(e){let t,n,l=void 0!==e[0]&&se(e);return{c(){t=m("main"),l&&l.c()},m(e,i){r(e,t,i),l&&l.m(t,null),n=!0},p(e,n){void 0!==e[0]?l?(l.p(e,n),1&n[0]&&V(l,1)):(l=se(e),l.c(),V(l,1),l.m(t,null)):l&&(T(),j(l,1,1,()=>{l=null}),H())},i(e){n||(V(l),n=!0)},o(e){j(l),n=!1},d(e){e&&u(t),l&&l.d()}}}const be="EDIT",we="DELETE",Ee="CREATE",Le="DETAILS";function _e(e,t,n){const l=L(),i=[],o=te,s=Q,c=Y,a=ee,d=X,r=Z;let{name:u=""}=t,{show_fields:f=[]}=t,{editable_fields:m=[]}=t,{table:h=[]}=t,{options:p=[]}=t;let g=-1;const y=new ne(u,m,f);function $(e){C(e),g=e;for(let e=0;e<h.length;e++)y.resetEditMode(e);y.setEditMode(e)}function v(e){Object.entries(h[e]).forEach(t=>{document.getElementById(u+y.getKey(t)+e).value=document.getElementById(u+y.getKey(t)+e+"copy").innerText}),y.resetEditMode(e),y.resetDeleteMode(e),g=-1}function b(e){C(e),Object.entries(h[e]).forEach(t=>{document.getElementById(u+y.getKey(t)+e+"copy").innerText=document.getElementById(u+y.getKey(t)+e).value});const t=y.gatherUpdates(e,h);l("update",{id:e,body:t}),y.resetEditMode(e),n(0,h)}function w(e){C(e),y.resetDeleteMode(e),g=e,y.setDeleteMode(e)}function E(e){y.resetEditMode(e),y.resetDeleteMode(e)}function _(e){const t=y.gatherUpdates(e,h);l("delete",{id:e,body:t}),y.resetDeleteMode(e),h.splice(e,1),g=-1,n(0,h)}function x(e){C(e);const t=y.gatherUpdates(e,h);l("details",{id:e,body:t})}function C(e){g!==e&&-1!==g&&v(g)}function B(e){void 0===i[e]||"DESC"===i[e]?i[e]="ASC":i[e]="DESC";n(0,h=h.sort((t,n)=>{var l=t[e],o=n[e];if("ASC"===i[e]){if(l<o)return-1;if(l>o)return 1}else{if(l<o)return 1;if(l>o)return-1}return 0}))}return e.$set=e=>{"name"in e&&n(1,u=e.name),"show_fields"in e&&n(19,f=e.show_fields),"editable_fields"in e&&n(20,m=e.editable_fields),"table"in e&&n(0,h=e.table),"options"in e&&n(2,p=e.options)},[h,u,p,o,s,c,a,d,r,y,$,v,b,w,E,_,function(){l("create",{})},x,B,f,m,i,g,l,-1,C,e=>{B(e)},e=>w(e),e=>$(e),e=>x(e),e=>b(e),e=>v(e),e=>_(e),e=>E(e)]}class xe extends W{constructor(e){super(),R(this,e,_e,ve,s,{name:1,show_fields:19,editable_fields:20,table:0,options:2},[-1,-1])}}function Ce(e){let t,n,l,i;const o=new xe({props:{name:"tableName",show_fields:[{name:"200px"},{sthg:"20%"},{why:"100px"}],editable_fields:["name","why"],options:["CREATE","EDIT","DELETE","DETAILS"],table:e[0]}});return o.$on("delete",e[1]),o.$on("update",e[2]),o.$on("create",e[3]),o.$on("details",Be),{c(){t=m("main"),n=m("h1"),n.textContent="Generic CRUD Table",l=g(),z(o.$$.fragment),v(t,"class","svelte-92w3al")},m(e,s){r(e,t,s),d(t,n),d(t,l),F(o,t,null),i=!0},p(e,[t]){const n={};1&t&&(n.table=e[0]),o.$set(n)},i(e){i||(V(o.$$.fragment,e),i=!0)},o(e){j(o.$$.fragment,e),i=!1},d(e){e&&u(t),U(o)}}}function Be(e){e.detail.id;const t=e.detail.body;console.log(JSON.stringify(t))}function Ie(e,t,n){let l=[{id:1,name:"A_NAME",sthg:"A_STHG",why:"because"},{id:2,name:"ANOTHER_NAME",sthg:"ANOTHER_STHG",why:"I can"},{id:3,name:"svelte-generic-crud-table",sthg:"Awesome !",why:"!"}],{name:i}=t;return e.$set=e=>{"name"in e&&n(4,i=e.name)},[l,function(e){e.detail.id,e.detail.body,console.log(JSON.stringify(e.detail.body))},function(e){const t=e.detail.id,i=e.detail.body;console.log(JSON.stringify(i)),n(0,l[t]=i,l)},function(e){console.log(JSON.stringify(e.detail)),l.push({id:-1,name:"new Element",sthg:"2345",why:"1234"}),n(0,l)},i]}return new class extends W{constructor(e){super(),R(this,e,Ie,Ce,s,{name:4})}}({target:document.body,props:{name:"world"}})}();
//# sourceMappingURL=bundle.js.map
