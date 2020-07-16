$.__proto__.tpl = function(_DATA){
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
		Dom : document.createDocumentFragment(), //虚拟节点
		domList : {},
		$domListIndex : 0,
		//待渲染节点索引
		domListSet : function(ele){
			var index = this.$domListIndex ++;
			this.domList[index] = ele;
			return index;
		},
		ECODE : [],
		def : $this.def(),
		init : function(ele){
			this.E = ele;
			this.replace();
			this.ECODE = this.createVDOM(this.Dom.childNodes);
			this.parseVDOMcode('_Push('+this.ECODE+')');
			//监听列表统一更新
			this.monitor();
		},
		//模板语法格式化为符合内部要求的语法
		replace : function(){
			var code = this.E.innerHTML;
			code = code.replace(/\{loop ([^\\]+?)\}/ig, '<ksa ksaaction="loop" ksafactor="$1">');
			code = code.replace(/\{if ([^\\]+?)\}/ig, '<ifscope><ksa ksaaction="if" ksafactor="$1">');
			code = code.replace(/\{elseif ([^\\]+?)\}/ig, '</ksa><ksa ksaaction="elseif" ksafactor="$1">');
			code = code.replace(/\{else\}/ig, '</ksa><ksa ksaaction="else">');

			code = code.replace(/\{\/if\}/ig, '</ksa></ifscope>');
			code = code.replace(/\{\/loop\}/ig, '</ksa>');

			code = code.replace(/\{eval\}/ig, '<ksaeval>');
			code = code.replace(/\{\/eval\}/ig, '</ksaeval>');
			code = code.replace(/\{eval ([\s\S]*?)\}/ig, '<ksaeval>$1</ksaeval>');
			this.code = code;
			$(this.Dom).html($.dom(code));
			return this;
		},
		setAttrs : function(ele, key, value){
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
			if(ele && ele.tagName ==='KSA' && ele.getAttribute('ksaaction') ==='loop'){
				var farr = $.explode(' ', ele.getAttribute('ksafactor'), '');
				farr[1] = farr[1] || '__value';
				return [farr[0], farr[2] ? farr[1] : '__', farr[2] ? farr[2] : farr[1]];
			}
		},
		getif : function(ele){
			if(ele && ele.tagName ==='KSA'){
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
				//遍历属性名
				if (ele.attributes && ele.attributes.length) {
					attrs = {};
					$.map(ele.attributes, function (v) {
						attrs[v.name] = v.value;
					});
					if(Object.keys(attrs).length > 0){
						attrs = JSON.stringify(attrs);
					}else{
						attrs = '';
					}
				}

				var rcode = '', monitor = null;
				if($.inArray(nodeType, [3,8])){
					var exp = ths.parseText(ele.nodeValue, ele);
					rcode = exp[0];
					if(exp[1]){
						monitor = 'function(){';
						//添加监听
						$.loop(exp[1], function( skv, vname){
							if($.isObject(skv)){
								monitor += "_M(arguments[0], "+vname+", '"+Object.keys(skv).join(',')+"');\n";
							}else if(typeof(ths.data[vname]) !== "undefined"){
								monitor += "_M(arguments[0], _$data_, '"+vname+"');\n";
							}
						});
						monitor += '}';
					}
				}else{
					var loopExp = ths.getloop(ele);
					if(loopExp){
						rcode += '_LOOP('+loopExp[0]+', function('+loopExp[1]+', '+loopExp[2]+'){ return ';
					}
					if(tag ==='IFSCOPE'){
						rcode += '(function(){';
					}
					var ifExp = ths.getif(ele);
					if(ifExp){
						if(ifExp[0] ==='if'){
							rcode += 'if('+ifExp[1]+'){ return ';
						}else if(ifExp[0] ==='elseif'){
							rcode += 'else if('+ifExp[1]+'){ return ';
						}else if(ifExp[0] ==='else'){
							rcode += 'else{ return ';
						}
					}
					if(ele.childNodes && ele.childNodes.length){
						rcode += ths.createVDOM(ele.childNodes, tag ==='IFSCOPE');
					}

					if(ifExp){
						rcode += '}';
					}

					if(tag ==='IFSCOPE'){
						rcode += '})()';
					}

					if(loopExp){
						rcode += '})'
					}
				}
				if(tag ==='IFSCOPE' || ifExp){
				}else{
					rcode = '_F(function(e){return _C((e||"'+tag+'"), '+nodeType+', '+(attrs || '""')+', '+(rcode || '""')+')}, '+monitor+')';
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
		monitorMap : [],
		//收集监听列表
		monitorGather : function(setObj, setKey, setFunc){
			var SetEvent = this.monitorMap;
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
			$.loop(this.monitorMap, function(sdt){
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
		parseElement : function(ele){

		},
		/**
		 * 统一解析VDOM虚拟树中的变量
		 */
		parseVDOMcode : function(_EvalCodes){
			var ths = this;
			var _VM = this.VDOM;

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
							ele = document.createElement(tag);
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
						$(ele).attr(attrs);
					}
				}
				var domIndex = ths.domListSet(ele);
				ths.setAttrs(ele, 'domIndex', domIndex);
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
			 * @param tree 对应VDOM树
			 * @param obj 需要监听的对象
			 * @param objKey 需要监听的键名
			 */
			function _M(ele, obj, objKey){
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
				var ele = document.createDocumentFragment();
				$.loop(dt, function(value, key){
					var node = func.call('', key, value);
					if($.isArray(node)){
						node = _C(node)
					}
					node && ele.appendChild(node);
				});
				return ele;
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
			_EvalCodes += "\n\nconsole.error(new Error('测试错误 爆源码'))";
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
		parseTextIndex : {}, //parseText变量缓存map
		/**
		 * 解析文本节点内容
		 * @param text
		 * @returns {{expression: string, tokens: []}}
		 */
		parseText : function  (text, ele) {

			var ths = this;
			var parseDt = [];
			if(text && text.trim()) {
				if (ths.parseTextIndex[text]) {
					parseDt = ths.parseTextIndex[text];
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
					ths.parseTextIndex[text] = parseDt;
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