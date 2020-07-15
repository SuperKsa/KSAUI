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
		init : function(ele){
			this.E = ele;
			this.replace();
			this.ECODE = this.createVDOM(this.Dom.childNodes);

			function _element(){

			}
			this.parseVDOMcode('_Push('+this.ECODE+')');
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

				var rcode = '';
				if($.inArray(nodeType, [3,8])){
					rcode = ths.parseText(ele.nodeValue, ele)[0];
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
					rcode = '_C("'+tag+'", '+nodeType+', '+(attrs || '""')+', '+(rcode || '""')+')';
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
		/**
		 * 统一解析VDOM虚拟树中的变量
		 */
		parseVDOMcode : function(_EvalCodes){
			var ths = this;
			var _VM = this.VDOM;

			//创建节点
			function _C(){
				var tag = arguments[0], nodeType = arguments[1], attrs = arguments[2], nodeValue = arguments[3];
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
				return ele;
			}

			//将DOM写到页面中
			function _Push(element){
				dom = document.createDocumentFragment();
				if($.isArray(element)){

					$.loop(element, function(e){
						dom.appendChild(e);
					});
				}else{
					dom.appendChild(element);
				}
				$(ths.E).empty();
				ths.E.appendChild(dom);
				return dom;
			}

			//收集监控变量
			function _G(){

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
			console.log(_EvalCodes);
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