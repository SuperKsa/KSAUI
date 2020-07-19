$.tpl = function(_DATA){
	var $this = this;

	//匹配模板变量正则 {xxx}
	var variableReg = /\$\{((?:.|\r?\n)+?)\}/g;
	//匹配js变量名正则
	var varsNameRegx = /(([\u4e00-\u9fa5_a-zA-Z$]+([\u4e00-\u9fa5_a-zA-Z0-9$]+)?)(((\[[0-9]+\])+|(\.[\u4e00-\u9fa5_a-zA-Z$][\u4e00-\u9fa5_a-zA-Z$0-9]+))+)?)(\.(charAt|charCodeAt|concat|fromCharCode|indexOf|includes|lastIndexOf|match|repeat|replace|search|slice|split|startsWith|substr|substring|toLowerCase|toUpperCase|trim|toLocaleLowerCase|toLocaleUpperCase|valueOf|toString|anchor|big|blink|bold|fixed|fontcolor|fontsize|italics|link|small|strike|sub|sup)\(.*?\))?/g;

	var ksaTpl = function(){
		return this.$tpl.init($this[0]);
	}
	ksaTpl.prototype.$tpl = {
		E : null,
		data : _DATA,
		cache : {},
		Dom : document.createDocumentFragment(), //虚拟节点
		ECODE : [],
		def : $this.def,
		init : function(ele){
			this.E = ele;
			this.replace();
			this.ECODE = this.createVDOM(this.Dom.childNodes);
			delete this.Dom;
			this.parseVDOMcode('_Push('+this.ECODE+')');
			delete this.ECODE;
			//监听列表统一更新
			this.monitor();
		},
		//模板语法格式化为符合内部要求的语法
		replace : function(){
			var code = this.E.innerHTML;
			code = code.replace(/\{loop ([^\\]+?)\}/ig, '<ksatpl ksaaction="loop" ksafactor="$1">');
			code = code.replace(/\{if ([^\\]+?)\}/ig, '<ifscope><ksatpl ksaaction="if" ksafactor="$1">');
			code = code.replace(/\{elseif ([^\\]+?)\}/ig, '</ksatpl><ksatpl ksaaction="elseif" ksafactor="$1">');
			code = code.replace(/\{else\}/ig, '</ksatpl><ksatpl ksaaction="else">');

			code = code.replace(/\{\/if\}/ig, '</ksatpl></ifscope>');
			code = code.replace(/\{\/loop\}/ig, '</ksatpl>');

			code = code.replace(/\{eval\}/ig, '<ksatpl ksaaction="eval">');
			code = code.replace(/\{\/eval\}/ig, '</ksatpl>');
			code = code.replace(/\{eval ([\s\S]*?)\}/ig, '<ksatpl ksaaction="eval">$1</ksatpl>');
			this.code = code;
			var dom = $(this.Dom);
			dom.html($.dom(code));
			dom.find('[ksaaction="eval"]').each(function(i, ele){
				ele.factor = ele.innerHTML;
				ele = $(ele);
				ele.html(ele.nextAll('',true));
			});
			return this;
		},
		setAttrs : function(ele, key, value){
			if(!ele){
				return;
			}
			if(!ele._KSA){
				ele._KSA = {};
			}
			if(!$.isset(key)){
				return;
			}
			if(!$.isset(value) && $.isset(ele._KSA[key])){
				delete ele._KSA[key];
			}else{
				ele._KSA[key] = value;
			}
		},
		getAttrs : function(ele, key){
			if(!ele._KSA){
				ele._KSA = {};
			}
			return $.isset(key) && $.isset(ele._KSA[key]) ? ele._KSA[key] : null;
		},
		/**
		 * 获取节点loop属性值
		 * @param ele
		 * @returns {[list, key, value]} undefined=非loop节点
		 */
		getloop : function(ele){
			if(ele && ele.tagName ==='KSATPL' && ele.getAttribute('ksaaction') ==='loop'){
				var farr = $.explode(' ', ele.getAttribute('ksafactor'), '');
				farr[1] = farr[1] || '__value';
				return [farr[0], farr[2] ? farr[1] : '__', farr[2] ? farr[2] : farr[1]];
			}
		},
		getif : function(ele){
			if(ele && ele.tagName ==='KSATPL'){
				var ac = ele.getAttribute('ksaaction');
				if($.inArray(ac, ['if','elseif','else'])){
					return [ac, ele.getAttribute('ksafactor')];
				}
			}
		},
		createVDOM : function(eleList, isScore){
			var ths = this;
			var Enode = [];
			$.loop(eleList, function(ele){

				var tag = ele.tagName ? ele.tagName : ''; //标签名小写 文本节点为空
				var nodeType = ele.nodeType;
				var attrs = null;
				var nodeValue = '';
				var isEvalTag = tag ==='KSATPL' && ele.getAttribute('ksaaction') ==='eval';
				var rcode = '', monitor = '';

				//遍历属性名
				if (ele.attributes && ele.attributes.length) {
					attrs = [];
					var attrsIsP = [];
					$.map(ele.attributes, function (v) {
						var value = v.value, key = v.name;
						if(!$.inArray(key, ['ksafactor','ksaaction'])) {
							var ep = ths.parseText(value);
							value = ep[0];
							if($.isObject(ep[1])){
								$.loop(ep[1], function(kv, kn){
									attrsIsP.push("["+kn+", '" + Object.keys(kv).join(',')+"']");
								});
							}
							if(key ==='v-update' || key ==='v-updatetext'){
								var upbj = $.keyName(v.value);
								if(upbj[0]){
									if(!upbj[1]){
										upbj[1] = upbj[0];
										upbj[0] = '_$data_';
									}
									attrs.push('"v-update":[(typeof('+upbj[0]+'.'+(upbj[1])+') !=="undefined" ? '+upbj[0]+' : ""), "'+upbj[1]+'", '+(key ==='v-updatetext')+']');
								}

							}else{
								attrs.push('"'+key+'":'+(value || '""')+'');
							}
						}
					});

					if(attrs.length>0){
						attrs = '{'+attrs.join(',')+'}';
						//如果attr有待监控变量时 以数组方式传递
						if(attrsIsP.length){
							attrs = '[function(){return '+attrs+'}, ['+attrsIsP.join(',')+']]';
						}
					}else{
						attrs = '';
					}

				}


				if(isEvalTag){
					rcode += '_F(function(){'+ele.factor+" \n\nreturn ";

				}
				if($.inArray(nodeType, [3,8])){
					var exp = ths.parseText(ele.nodeValue, ele);
					if(exp) {
						rcode = exp[0];
						if (exp[1]) {

							//添加监听
							$.loop(exp[1], function (skv, vname) {
								if ($.isObject(skv)) {
									monitor += "_M(arguments[0], " + vname + ", '" + Object.keys(skv).join(',') + "');\n";
								} else if (typeof (ths.data[vname]) !== "undefined") {
									monitor += "_M(arguments[0], _$data_, '" + vname + "');\n";
								}
							});
						}
					}
				}else{

					var loopExp = ths.getloop(ele);
					if(loopExp){
						rcode += '_LOOP('+loopExp[0]+', function('+loopExp[1]+', '+loopExp[2]+'){ return ';
					}
					if(tag ==='IFSCOPE'){
						rcode += '_if(';
					}
					var ifExp = ths.getif(ele);
					if(ifExp){
						var exp = ths.parseText('${'+ifExp[1]+'}');
						var factor = [];
						$.loop(exp[1], function(v, k){
							if($.isObject(v)){
								factor.push('['+k+', ["'+Object.keys(v).join('","')+'"]]');
							}
						});
						if(factor.length){
							factor = '['+factor.join(',')+']';
						}else{
							factor = '""';
						}
						if(ifExp[0] ==='if'){
							//rcode += 'if('+ifExp[1]+'){ return ';
							rcode += '[function(){return '+ifExp[1]+'}, '+factor+', function(){return ';
						}else if(ifExp[0] ==='elseif'){
							//rcode += 'else if('+ifExp[1]+'){ return ';
							rcode += ',[function(){return '+ifExp[1]+'}, '+factor+', function(){return ';
						}else if(ifExp[0] ==='else'){
							//rcode += 'else{ return ';
							rcode += ',["else","", function(){return';
						}
					}
					//遍历子节点
					if(ele.childNodes && ele.childNodes.length){
						rcode += ths.createVDOM(ele.childNodes, tag ==='IFSCOPE');
					}

					if(ifExp){
						rcode += '}]';
						//rcode += '}';
					}

					if(tag ==='IFSCOPE'){
						rcode += ')';
					}

					if(loopExp){
						rcode += '})'
					}

				}
				if(tag ==='IFSCOPE' || ifExp || isEvalTag){
				}else{
					monitor = monitor ? (', function(){'+monitor)+'}' : '';
					rcode = '_F(function(){return _C((arguments[0]||"'+tag+'"), '+nodeType+', '+(attrs || '""')+', '+(rcode || '""')+')}'+monitor+')';
				}

				if(isEvalTag){
					rcode += '})';
				}
				Enode.push(rcode);
			});
			var length = Enode.length;
			if(length === 1){
				Enode = Enode[0];
			}else if(isScore){
				Enode = Enode.join('');
			}else if(!isScore && length >1){
				Enode = '['+Enode.join(', ')+']';
			}else{
				Enode = '';
			}
			return Enode;
		},
		//收集监听列表索引 一组一个对象， 每组下{obj:监听对象, keys:{监听键名:[setFunction1, setFunction2, setFunction3, ...]}}
		monitorGather : function(setObj, setKey, setFunc){
			if(!this.cache.monitorMap){
				this.cache.monitorMap = [];
			}
			var SetEvent = this.cache.monitorMap;
			if($.isArray(setFunc) && !setFunc.length){
				return;
			}
			if(setObj && $.isObject(setObj) && setFunc) {
				setKey = $.explode(',', setKey,' ');
				var addKey = null;
				$.loop(SetEvent, function (obj, k) {
					if (obj.object === setObj) {
						addKey = k;
					}
				});
				//如果监听对象不在列表则添加一个
				if(addKey === null){
					addKey = SetEvent.push({object: setObj, keys: {}});
					addKey --;
				}
				var setEvn = SetEvent[addKey];
				$.loop(setKey, function (vk) {
					setEvn.keys[vk] = setEvn.keys[vk] ? setEvn.keys[vk] : [];
					if($.isArray(setFunc)){
						$.loop(setFunc, function(f){
							if(!$.inArray(f, setEvn.keys[vk])){
								setEvn.keys[vk].push({function : f, isPush:false});
							}
						});
					}else if($.isFunction(setFunc) && !$.inArray(setFunc, setEvn.keys[vk])){
						setEvn.keys[vk].push({function : setFunc, isPush:false});
					}
				});
			}
		},
		monitor : function(){
			var ths = this;
			if(!this.cache.monitorMap){
				this.cache.monitorMap = [];
			}
			$.loop(this.cache.monitorMap, function(sdt){
				$.loop(sdt.keys, function(funs, key){
					$.loop(funs, function(f){
						if(!f.isPush) {
							ths.def.set(sdt.object, key, f.function);
							f.isPush = true;
						}
					});
				});
			});
		},
		/**
		 * 解析创建函数 IF区域中的数据
		 * @returns {[number, *, {}]}
		 */
		parseIF : function(){
			var ths = this;
			var R, Rcheck, monObj = {};
			var ifKey = $.autoID('ktpl-parseIF');
			$.loop(arguments, function(value, inkey){
				if(!Rcheck && (value[0] ==='else' || value[0]())){
					R = value[2]();
					Rcheck = true;
					return true;
				}
				if(value[1]) {
					$.loop(value[1], function (mv) {
						var mvID = $.objectID(mv[0]);
						if(monObj[mvID]){
							$.loop(mv[1], function (k) {
								if(!$.inArray(k, monObj[mvID][1])){
									monObj[mvID][1].push(k);
								}
							});
						}else{
							monObj[mvID] = mv;
						}
					});
				}
			});
			if(!ths.cache.ifscope){
				ths.cache.ifscope = {};
			}
			if(R){
				ths.cache.ifscope[ifKey] = R;
			}

			return [ifKey, R , monObj];
		},

		/**
		 * 双向绑定
		 */
		vUpdateModel : function(){
			if(!arguments[0] || !arguments[1] || !arguments[1][0]){

			}
			var ele = $(arguments[0]),
				tag = ele[0].tagName,
				type = ele.attr('type'),
				obj = arguments[1][0],
				key = arguments[1][1],
				isText = !!arguments[1][2];
			if($.isObject(obj)){
				if(tag ==='INPUT' && $.inArray(type,['checkbox','radio'])){
					ele.click(function(){
						if(ele.attr('checked')){
							obj[key] = ele.val();
						}else{
							obj[key] = '';
						}
					});
				}else if(tag ==='INPUT' || tag ==='TEXTAREA'){
					ele.keyup(function(){
						obj[key] = ele.val();
					});
				}else if(tag ==='SELECT'){
					ele.change(function(){
						obj[key] = isText ? ele.valText() : ele.val();
					});
				}
			}
		},
		/**
		 * 统一解析VDOM虚拟树中的变量
		 */
		parseVDOMcode : function(_EvalCodes){
			var ths = this;
			var _VM = this.VDOM;

			/**
			 * 创建节点并创建变量监听
			 * @param Cfunc
			 * @param Mfunc
			 * @returns {*}
			 */
			function _F(Cfunc, Mfunc){
				var ele = Cfunc();
				ths.setAttrs(ele, 'renderFunction', function(){
					Cfunc(ele);
				});
				Mfunc && Mfunc(ele);
				return ele;
			}

			/**
			 * 创建节点
			 * @returns {Comment | DocumentFragment}
			 * @private
			 */
			function _C(){
				var tag = arguments[0];

				var nodeType = arguments[1],
					attrs = arguments[2],
					nodeValue = arguments[3],
					monitorFunc = arguments[4];
				if($.isObject(tag) && tag.nodeType){
					tag.nodeValue = nodeValue;
					return tag;
				}
				var ele;
				if($.isArray(tag)){
					ele = document.createDocumentFragment();
					$.loop(tag, function(e){
						if($.isArray(e)){
							e = _C(e);
						}
						e && ele.appendChild(e);
					});
				}else if(nodeType === 11){

				}else{
					switch (nodeType) {
						case 3:
							ele = document.createTextNode(nodeValue);
							break;
						case 8:
							ele = document.createComment(nodeValue);
							break;
						default:
							if(tag === 'KSATPL'){
								ele = document.createDocumentFragment();
							}else{
								ele = document.createElement(tag);
							}

							if($.isArray(nodeValue)){
								$.loop(nodeValue, function(e){
									if(e){
										ele.appendChild(e);
									}
								});
							}else if(nodeValue && $.isObject(nodeValue) && nodeValue.nodeType){
								ele.appendChild(nodeValue);
							}
					}
					if(attrs){
						var insetattr;
						//attr属性存在需要监听的变量名
						if($.isArray(attrs)){
							insetattr = attrs[0]();
							if(attrs[1]) {
								$.loop(attrs[1], function (v) {
									ths.monitorGather(v[0], v[1], function () {
										var e = $(ele);
										var newats = attrs[0]();
										var oldats = $(ele).attr();
										var inats = {};
										//删除原来的
										$.loop(oldats, function (nv, nk) {
											if (!newats[nk]) {
												e.removeAttr(nk);
											} else if (newats[nk] && newats[nk] != nv) {
												e.attr(nk, newats[nk]);
											}
										});
										$.loop(newats, function (nv, nk) {
											if (!oldats[nk] || oldats[nk] != nv) {
												e.attr(nk, nv);
											}
										});
									});
								});
							}
						}else{
							insetattr = attrs;
						}


						if($.isObject(insetattr)){
							var el = $(ele);
							$.loop(insetattr, function(v, k){
								if(k ==='v-update'){
									ths.vUpdateModel(ele, v)
								}else{
									el.attr(k, v);
								}
							});
						}


					}
				}
				if(monitorFunc){
					monitorFunc(ele);
				}

				return ele;
			}

			/**
			 * vdom变量监听绑定函数
			 *
			 * 每个需要监听的对象键名都交给monitor
			 *
			 * @param ele 对应VDOM树
			 * @param obj 需要监听的对象
			 * @param objKey 需要监听的键名
			 * @param at 动作 默认为写nodevalue
			 */
			function _M(ele, obj, objKey, at){
				var func = [], func = ths.getAttrs(ele,'renderFunction');
				if(!func){
					return;
				}
				ths.monitorGather(obj, objKey, function(){
					func(ele)
				});
			}

			//将DOM写到页面中
			function _Push(element){
				dom = document.createDocumentFragment();
				if($.isArray(element)){

					$.loop(element, function(e){
						e && dom.appendChild(e);
					});
				}else{
					dom.appendChild(element);
				}
				$(ths.E).empty();
				ths.E.appendChild(dom);
				return dom;
			}

			//收集监控变量
			function _G(obj, objKey, func){
				if(func) {
					ths.monitorGather(obj, objKey, function (v) {
						func(v);
					});
				}
			}

			//循环回调
			function _LOOP(dt, func){
				if(!ths.cache.loopscope){
					ths.cache.loopscope = {};
				}
				var loopKey = $.autoID('ktpl-parseLoop');
				ths.cache.loopscope[loopKey] = [];
				var loopCache = ths.cache.loopscope[loopKey];

				var newEle = document.createDocumentFragment();
				var valueOld = {};

				function pushNode(value, key, pcache){
					var inNodes = [];
					var node = func.call('', key, value);
					if($.isArray(node)){
						node = _C(node);
						inNodes = [].slice.call(node.childNodes);
					}else{
						inNodes = [node];
					}

					//loop删除数据监听
					ths.def.del(dt, key, function(){
						//删除缓存中对应节点
						var newCache = [];
						$.loop(loopCache, function(v){
							if(!$.inArray(v, inNodes)){
								newCache.push(v);
							}
						});
						var loopisEmpty = !newCache.length || (newCache.length === 1 && newCache[0]._KSA_Placeholder);
						loopCache = newCache;

						var length = inNodes.length -1;
						$.loop(inNodes, function(e, k){

							//如果loop域是空的 则先创建占位节点
							if(loopisEmpty && k === length){

								$(e).after(_loopcreateCom());
							}
							$(e).remove();
						});

					});
					valueOld[key] = value;
					return node;
				}

				function _loopcreateCom(){
					//如果loop没有数据 则创建一个占位节点
					var node = document.createComment('KSA-Placeholder:loop');
					node._KSA_Placeholder = 1;
					loopCache.push(node);
					return node;
				}




				$.loop(dt, function(value, key){
					var node = pushNode(value, key);
					var nodes;
					if(node.nodeType === 11){
						nodes = [].slice.call(node.childNodes);
					}else{
						nodes = [node];
					}
					newEle.appendChild(node);

					$.loop(nodes, function(v){
						loopCache.push(v);
					});
				});

				//loop添加数据监听
				ths.def.add(dt, function(key, value){
					var node = pushNode(value, key);

					var markDom;
					$.loop(loopCache, function(e){
						if($.isIndom(e)) {
							markDom = e;
						}
					});
					var loopisEmpty = !loopCache.length || (loopCache.length === 1 && loopCache[0]._KSA_Placeholder);
					if(node.nodeType === 11){
						$.loop(node.childNodes, function(v){
							loopCache.push(v);
						});
					}else{
						loopCache.push(node);
					}
					$(markDom).after(node);
					if(loopisEmpty){
						$(markDom).remove();
					}
				});




				if(!loopCache.length){
					newEle.appendChild(_loopcreateCom());
				}
				return newEle;
			}

			/**
			 * if判断节点回调处理
			 */
			function _if(){
				var Args = arguments;
				var ifdt = ths.parseIF.apply(ths, Args);
				var cachekey = ifdt[0];

				if(ifdt[2]){
					$.loop(ifdt[2], function (mv) {
						ths.monitorGather(mv[0], mv[1], function(){
							var cache = ths.cache.ifscope[cachekey];
							if(cache){
								var newdom = ths.parseIF.apply(ths, Args);
								if(newdom !== cache){
									ths.cache.ifscope[cachekey] = newdom[1];
									var markDom;
									$.loop(cache, function(e){
										if(!markDom && $.isIndom(e)) {
											markDom = e;
										}else{
											$(e).remove();
										}
									});
									$(markDom).before(newdom[1]).remove();
								}
							}
						});
					});
				}

				return ifdt[1];
			}
			//===================================================
			var invars = [];
			var ginvars = [];
			$.loop(this.data, function( value, key){
				var svs = "_$data_"+($.isNumber(key) ? ("["+key+"]") : ("."+key));
				invars.push("var "+key+" = "+svs+";");
				ginvars.push("_G(_$data_, '"+key+"', function(v){"+key+"= v;})");
			});
			invars = invars.join("\n");
			ginvars = ginvars.join("\n");
			_EvalCodes = "function _Vcall(_$data_){\n"+invars+"\n"+ginvars+" \n "+_EvalCodes+"}";
			//_EvalCodes += "\n\nconsole.error(new Error('测试错误 爆源码'))";
			//console.log(_EvalCodes);
			eval(_EvalCodes);
			_Vcall.call('',ths.data);
		},
		/**
		 * 提取字符串中的变量名
		 * @param str
		 * @returns {[]}
		 */
		extractParamName : function(str){
			var ParamName = [];
			str = str.trim();
			//去掉字符串 去掉转义引号' " 去掉引号中间的内容 去掉.()[]左右空格
			str = str.replace(/\\'|\\"/g,'').replace(/("|')[^"']+("|')/g,'$1$2').replace(/\s+([\.\(\)\[\]\:\?])[\s+]?/g,'$1');
			str.replace(varsNameRegx, function(){
				if(arguments && arguments[1]){
					ParamName.push(arguments[1]);
				}
			});
			return ParamName;
		},
		/**
		 * 解析文本节点内容
		 * @param text
		 * @returns {{expression: string, tokens: []}}
		 */
		parseText : function  (text, ele) {
			if(!this.cache.parseTextIndex){
				this.cache.parseTextIndex = {};
			}
			var ths = this;
			var parseDt = [];
			var parseTextIndex = this.cache.parseTextIndex;
			if(text && text.trim()) {
				if (parseTextIndex[text]) {
					parseDt = parseTextIndex[text];
				} else {

					var parseCode = [];
					var variableList = {};

					var tagRE = variableReg;

					var lastIndex = tagRE.lastIndex = 0;
					var match, index;
					while ((match = tagRE.exec(text))) {
						index = match.index;
						if (index > lastIndex) {
							parseCode.push('"' + text.slice(lastIndex, index) + '"');
						}
						var kname = match[1].trim();
						$.loop(ths.extractParamName(kname), function (v) {
							var skv = $.keyName(v);
							if (skv[1]) {
								variableList[skv[0]] = variableList[skv[0]] ? variableList[skv[0]] : {};
								variableList[skv[0]][skv[1]] = 1;
							} else {
								variableList[skv[0]] = 1;
							}
						});
						parseCode.push(kname);

						lastIndex = index + match[0].length;
					}
					if (lastIndex < text.length) {
						parseCode.push(JSON.stringify(text.slice(lastIndex)))
					}
					parseCode = parseCode.length ? parseCode.join('+') : null;
					if (parseCode) {
						parseCode = parseCode.replace(/(\r\n|\r|\n)/g, function (_1) {
							return _1 === "\r\n" ? '\\r\\n' : (_1 === "\r" ? '\\r' : '\\n');
						});
					}
					variableList = $.isEmpty(variableList) ? null : variableList;
					parseDt = [parseCode, variableList];
					parseTextIndex[text] = parseDt;
				}
				if (ele) {
					ths.setAttrs(ele, 'parseCode', parseDt[0]);
					ths.setAttrs(ele, 'variableList', parseDt[1]);
				}
			}
			return parseDt;
		},
	};
	return new ksaTpl().$tpl;
};