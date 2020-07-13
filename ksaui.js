/**
 * KSA核心JS
 * Author : cr180.com
 */
function debug(data){
	if(typeof data ==='object'){
		console.dir(data);//debug
	}else{
		console.log('%cKSAUI-Debug','background:#00c; color:#fff',data);//debug
	}
}
var consoleGroupN = {};
function debugTime(key){
    consoleGroupN[key] = consoleGroupN[key] >=0 ? consoleGroupN[key] +1 : 0;
    key = key+'-'+consoleGroupN[key];
    console.time(key);
    return function(){
        console.timeEnd(key);
    };
}

(function(document, undefined) {



	function newFragment(){
        return document.createDocumentFragment();
    }

	/**
	 * 字符串转虚拟dom
	 * @param code
	 * @returns {ActiveX.IXMLDOMNodeList | NodeListOf<ChildNode>}
	 */
	function createDom(code){
		//创建虚拟dom并写入字符串
		dom = document.createRange().createContextualFragment(code);
		return [].slice.call(dom.childNodes);
	}

	/**
	 * 创建临时dom并回调
	 * @param {html|Node} code html或节点
	 * @param {function} callback 回调函数
	 * @param {boolean} reOrder 是否倒序回调
	 * @returns {tempDom}
	 */
	function tempDom(code, callback, reOrder){
	    var dom;
	    if(code instanceof $){
            dom = code;
        }else if($.isDomAll(code)) {
			dom = code instanceof  NodeList ? code : [code];
		}else if($.isArray(code)){
	    	dom = code;
        //创建一个虚拟dom
        }else{
            dom = createDom(code);
        }

		//将传入的html或dom对象添加到虚拟dom中
		$.map(this, function (ele) {
			var n = !reOrder ? dom.length : 0;
			var i = reOrder ? dom.length -1 : 0;
			while (reOrder ? i >=0 : i < n){
				var node = dom[i];
				//callback.call(ele, ele, node.cloneNode(true), node);
				if(node) {
					callback.call(ele, ele, node);
				}
				reOrder ? i -- : i++;
			}
		});
		return this;
	}

	var $ = function(selector){
		return new K.A(selector);
	}

	var K = {
		version : '1.0',
        A : function(selector){
            var self = this;

            if(selector) {
                if (selector instanceof $) {
                    return selector;
                } else if (self.isDomAll(selector)) {
                    selector = [selector];

                }else if(self.isString(selector) && (selector = selector.trim()) && selector.indexOf('<') ==0 && selector.lastIndexOf('>') == selector.length-1){
                    selector = createDom(selector);

                }else if(self.isString(selector)) {
                    selector = [].slice.call(document.querySelectorAll(selector));
                }

                var length = selector.length;

                var obj = {};
                for(var k in selector){
                    if(self.isDomAll(selector[k])) {
                        obj[k] = selector[k];
                    }
                }
                selector = obj;
                selector.length = length;
            }else{
                selector = {length:0};
            }

            self = $.arrayMerge(self, selector);
            return self;
        }
	};

    $.__proto__ = K.A.prototype = K;

    K.ready = function(callback) {
        if (/complete|loaded|interactive/.test(document.readyState)) {
            callback($);
        } else {
            document.addEventListener('DOMContentLoaded', function() {
                callback($);
            }, false);
        }
        return this;
    }
// ====================== 创建虚拟DOM ====================== //
	K.dom = function(code){
		return createDom(code);
	}
// ====================== 文档操作 ====================== //

	/**
	 * 添加class
	 * 最后更新 : 2020年6月19日 20:01:50
	 * @param name 需要添加的class值，多个以空格分割
	 * @returns {$}
	 */
	K.addClass = function(name){
		name = $.explode(' ', name, '');
		if(name){
			this.map(function(ele){
				var classList = $.explode(' ', ele.getAttribute('class'),' ');
				var addname = $.map(name, function (v) {
					return !$.inArray(v, classList) ? v : null;
				});
				addname = $.implode(' ',addname);
				if(addname){
					ele.className = ele.className + (ele.className ? ' ' : '') +addname;
				}
			});
		}
		return this;
	}

	/**
	 * 删除class
	 * 最后更新 : 2020年6月19日 20:01:50
	 * @param name 需要删除的class值，多个以空格分割
	 * @returns {$}
	 */
	K.removeClass = function(name){
		name = $.explode(' ', name, '');
		if(name){
			$.map(this,function(ele){
				var classList = $.explode(' ', ele.getAttribute('class'),' ');
				classList = $.map(classList, function (v) {
					return !$.inArray(v, name) ? v : null;
				});
				classList = $.implode(' ',classList);
				classList ? ele.setAttribute('class', classList) : ele.removeAttribute('class');
			});
		}
		return this;
	}

	K.isAttr = function (key) {
		key = $.explode(' ', key, '');

		for(var k in key){
			if(this[0].getAttribute(key[k]) !== null){
				return true;
			}
		}
		return false;
	}

    /**
     * attr操作
     * key与value都不传值时表示读取所有属性 以object方式返回
     * 如选择器有多个节点，则根据节点序号以数组方式返回
     * @param {string|object} key 属性名支持单个值、多个值(空格分开)、对象（写入模式，键名=属性名 键值=属性值）
     * @param value 属性值 不传入=读取模式 null|空值=删除模式
     * @returns {K|[]}
     */
	K.attr = function (key, value) {
        var isKey = $.isset(key);
        var keyIsobj = $.isObject(key);
        if (isKey && !keyIsobj) {
            key = $.explode(' ', key, ' ');
        }
        var isvalue = $.isset(value);
        var attrs = [];

        value = value === '' ? null : value;

        this.map(function (ele) {
            var ats = {};
            if(!isvalue && !isKey){
                var a = ele.attributes;
                for(var i=a.length-1; i>=0; i--) {
                    ats[a[i].name] = a[i].value;
                }
            }else{
                var setDt = {}, setDtCount =0;
                $.loop(key, function(k, v){
                    //移除属性
                    if (value === null) {
                        ele.removeAttribute(v);
                        //读取属性
                    }else if(!isvalue){
                        ats[v] = ele.getAttribute(v);
                    }else if(isvalue && keyIsobj){
                        ele.setAttribute(k, v);
                        if (k.indexOf('data-') == 0) {
                            setDt[k] = v; setDtCount ++;
                        }
                    }else if(isvalue){
                        if (v.indexOf('data-') == 0) {
                            setDt[v] = value; setDtCount ++;
                        }
                        ele.setAttribute(v, value);
                    }
                });
                //写入data属性
                if(setDtCount >0){
                    if (!ele._KSADATA) {ele._KSADATA = {};}
                    $.loop(setDt, function(k, v){
                        ele._KSADATA[k.substr(5)] = v;
                    });
                }
            }
            if($.count(ats) == 1){
                ats = Object.values(ats)[0];
            }
            attrs.push(ats);
        });
        if(!isvalue){
            if(attrs.length == 1){
                attrs = attrs[0];
            }
            return attrs;
        }
	    return this;
	}

    K.removeAttr = function (key) {
	    if(key) {
            this.attr(key, null);
        }
        return this;
    }

    K.data = function(key, value){
	    var keyisobj = $.isObject(key),
            isvalue = $.isset(value),
            isdel = key && value ==='';

	    var setData = keyisobj ? key : (isvalue ? {} : null);
	    var getKey = [];

	    if(!keyisobj && key){
            key = $.explode(' ', key, '');
            $.each(key, function(k, v){
                if(isvalue){
                    setData[v] = value;
                }else{
                    getKey.push(v);
                }
            });
        }

	    var getData = [];
        this.map(function (ele) {
            if(!ele._KSADATA){
                ele._KSADATA = {};
            }
            var getdt = {};
            if(setData){
                $.loop(setData, function(k, v){
                    if(!$.isObject(v) && ele.attributes['data-'+k]){
                        ele.setAttribute('data-'+k, v);
                    }
                    ele._KSADATA[k] = v;
                });
            }else if(getKey.length){
                $.loop(getKey, function(_, k){
                    var v = ele._KSADATA[k] || (ele.getAttribute('data-'+k) || undefined);
                    if($.isset(v)) {
                        getdt[k] = v;
                    }
                });


            }else if(!key && !isvalue){
                getdt = ele._KSADATA;
                var a = ele.attributes;
                for(var i=a.length-1; i>=0; i--) {
                    if(a[i].name.indexOf('data-') ===0){
                        getdt[a[i].name.substr(5)] = a[i].value;
                    }
                }

            }else if(isdel){
                $.loop(key, function(_, k){
                    delete ele._KSADATA[k];
                });
            }

            if($.count(getdt) == 1){
                getdt = Object.values(getdt)[0];
            }
            getData.push(getdt);
        });

        if(!keyisobj && !isvalue){
            if(getData.length == 1){
                getData = getData[0];
            }
            return getData;
        }

	    return this;
    }

	/**
	 * 清空节点
	 */
	K.empty = function(){
		this.map(function(ele){
			ele.innerHTML = '';
		});
		return this;
	}

	/**
	 * 表单值的读写
	 * @param value
	 * @returns {K|[]}
	 */
	K.val = function(value){
		if($.isset(value)){
			this.map(function(ele){
				if (ele.nodeType === 1) {
					var tg = ele.tagName;
					switch (tg) {
						case 'INPUT':
							ele.value = value; break;
						case 'SELECT':
							$.each(ele.options, function(_, el){
								el.selected = el.value == value;
							});
							break;
						case 'TEXTAREA':
							ele.value = value; break;
						default:
					}
				}
			});
			return this;
		//获取值，如果有多个对象，则按数组顺序返回对应值
		}else {
			var t = [];
			this.map(function (ele, i) {
				var val, tg = ele.tagName;
				switch (tg) {
					case 'INPUT':
						val = ele.value; break;
					case 'SELECT':
						val = ele.options[ele.selectedIndex].value; break;
					case 'TEXTAREA':
						val = ele.value; break;
					default:
				}
				t.push(val);
			});
			if(t.length == 1){
				t = t[0];
			}
			return t;
		}
	}

	/**
	 * 写入或读取文本
	 * @param {html|Node} value 传值表示写入
	 * @returns {string|$}
	 */
	K.text = function(value){
		if($.isset(value)){
			this.map(function(ele){
				if (ele.nodeType === 1 || ele.nodeType === 11 || ele.nodeType === 9) {
					ele.textContent = value;
				}
			});
			return this;
		}else {
			var t = [];
			$.each(this, function (k, value) {
				t[k] = value.innerText;
			});
			return t.join("\n");
		}
	};

	/**
	 * 读写文本节点
	 * @param value
	 * @returns {string|K}
	 */
	K.nodeValue = function(value){

		if($.isset(value)){
			value = $.isArray(value) ? value[0].nodeValue : value;
			this.map(function(ele){
				if (ele.nodeType === 3) {
					ele.nodeValue = value;
				}
			});
			return this;
		}else {
			var t = [];
			$.each(this, function (k, value) {
				value.nodeType == 3 && t.push(value.nodeValue);
			});
			return t.join("\n");
		}
	};

	/**
	 * 写入或读取HTML源码
	 * @param {html|Node} value 传值表示写入
	 * @returns {string|$}
	 */
	K.html = function(value){
		if($.isset(value)){
			this.map(function(ele){
				if($.isObject(value)){
					$(ele).empty().append(value);
				}else{
					ele.innerHTML = value;
				}
			});
			return this;
		}else{
			var t = [], i=0;
			this.map(function(ele){
				t[i] = ele.innerHTML || value.innerText;
				i ++;
			});
			return t.join("\n");
		}
	};



	/**
	 * 移除节点
	 * @returns {$}
	 */
	K.remove = function(){
		this.map(function(ele){
			ele.parentNode && ele.parentNode.removeChild(ele);
		});
		return this;
	}

	/**
	 * 在节点之后添加
	 * @param {html|Node} html
	 * @returns {this}
	 */
	K.after = function (html) {
		return tempDom.call(this, html, function(ele, node){
			ele.parentNode && ele.parentNode.insertBefore(node, ele.nextSibling);
		}, true);
	}

	/**
	 * 在节点之前添加
	 * @param {html|Node} html
	 * @returns {this}
	 */
	K.before = function (html) {
		return tempDom.call(this, html, function(ele, node){
			ele.parentNode && ele.parentNode.insertBefore(node, ele);
		});
	}

	/**
	 * 在节点内部最后添加
	 * @param {html|Node} html
	 * @returns {this}
	 */
	K.append = function (html, callback) {
		return tempDom.call(this, html, function(ele, node){
			if(!node){
				return;
			}

			var el = ele.appendChild(node);
            callback && callback.call(ele, el);
		});
	}

	/**
	 * 在节点内部最前面添加
	 * @param {html|Node} html
	 * @returns {this}
	 */
	K.prepend = function (html, callback) {
		return tempDom.call(this, html, function(ele, node){
			ele.insertBefore(node, ele.firstChild);
		}, true);
	}

// ====================== 遍历 ====================== //

	K.instanceof = function(a, b){
		return a instanceof b;
	}

    /**
     * 循环函数
     * @param {object} dt 数组或对象
     * @param {func} 每次循环的函数 function(key,value){...}
     */
    K.loop = function(dt,fun){
		if(dt && ($.isArray(dt) || $.instanceof(dt,NodeList))){
			for(i=0;i<dt.length;i++){
				val = dt[i];
				if(fun(i, dt[i] ,i) === true){
					return;
				}
			}
		}else if(dt && $.isObject(dt)){
			var i=0;
			for(var k in dt){
				val = dt[k];
				if(fun(k,dt[k],i) === true){
					return;
				}
				i++;
			}
		}
    }

	/**
	 * 循环遍历
	 * @param obj
	 * @param callback
	 * @returns {*}
	 */
	K.each = function(obj, callback) {
		var k, i=0;
		if ($.isArray(obj) || $.isObject(obj)) {
			for (k in obj) {
				callback(k, obj[k], i);
				i ++;
			}
		} else {
			callback = callback || (typeof(obj) =='function' ? obj : null);
			obj = $.isFunction(obj) ? this : obj;

			for (k in obj) {
				var value = obj[k];
				if($.isDomAll(value)) {
					callback.call(value, k, value, i);
					i ++;
				}
			}
		}
		return obj;
	}


	/**
	 * 数组map方法实现
	 * @param elements
	 * @param callback
	 * @returns {[]}
	 */
    K.map = function(elements, callback){
    	if(!callback && $.isFunction(elements)){
			callback = elements;
			elements = this;
		}
        var value, values = [], i, key;

        if ($.isArrayLike(elements)) {
			for(i = 0; i < elements.length; i++){
				value = callback(elements[i], i);
				if(value != null){
					values.push(value);
				}
			}
		}else {

			for(key in elements){
				value = callback(elements[key], key);
				if (value != null){
					values.push(value);
				}
			}
		}
        return values;
    }

	/**
	 * 取集合范围
	 * @returns {*[]}
	 */
	K.slice = function(){
		return [].slice.apply(this, arguments);
	}

	/**
	 * 取匹配集合 顺序为n的节点
	 * @param n
	 * @returns {*}
	 */
	K.eq = function(n){
		var self = this;
		n += 0;
		this.each(function(i, ele){
			if(i != n){
				self.length --;
				delete self[i];
			}
		})
		return this;
	}

	/**
	 * 取匹配集合第一个
	 * @returns {any}
	 */
	K.first = function(){
		return $(this[0]);
	}

	/**
	 * 取匹配集合最后一个
	 * @returns {any}
	 */
	K.last = function(){
		var n = this.length > 1  ? this.length -1 : 0	;
		return $(this[n]);
	}

	/**
	 * 检查集合中是否存在选择器范围
	 * @param selector
	 * @returns {boolean} 返回 false | true
	 */
	K.is = function(selector){
		var s = false;
		$.map(this,function(ele){

			if(isSelectDom(ele, selector)){
				s = true;
			}
		});
		return s;
	}

    /**
     * 检查指定元素是否被选择器选择
     * @param ele 需要检查的元素
     * @param selector 选择器
     * @returns {boolean|number|*}
     */
    var isSelectDom = function(ele, selector) {
        if (!selector || !ele || ele.nodeType !== 1){
            return false
        }
        var matchesSelector = ele.matches || ele.webkitMatchesSelector || ele.mozMatchesSelector || ele.oMatchesSelector || ele.matchesSelector;
        try {
            return matchesSelector.call(ele, selector);
        }catch (e) {
            console.error('isSelectDom执行错误，浏览器不支持matches');
        }
    }

	/**
	 * 递归遍历DOM节点
	 * @param element 需遍历的dom
	 * @param key 需遍历的节点
	 * @param selector 选择器
	 * @returns {[]}
	 */
    var dir = function (element, key, selector) {
        var rdom = [];
		$.map(element,function(el){
			while ((el = el[key]) && el.nodeType !== 9) {
				el.nodeType === 1 && (!selector || isSelectDom(el, selector)) && rdom.push(el);
			}
		});
        return rdom;
    };

    /**
     * 子孙遍历
     * @param selector
     * @returns
     */
    K.find = function(selector){
        selector = selector || '*';
        var rdom = $(), ri =0;
		this.map(function(ele){
			$.map(ele.querySelectorAll(selector), function(el){
				rdom[ri] = el;
				ri ++;
			});
		});
		rdom.length = ri;
        return rdom;
    }

    /**
     * 直接子级遍历
     * @param selector
     */
	K.children = function(selector){
        selector = selector || '*';
	    var self = this, rdom = $(), ri =0;
	    this.map(function(ele){
            self.map(ele.childNodes, function(el){
                if (isSelectDom(el, selector)) {
                    rdom[ri] = el;
					ri ++;
                }
            });
        });
		rdom.length = ri;
	    return rdom;
    }

    /**
     * 遍历所有子级（包括文本节点）
     */
    K.childAll = function(){
        var self = this, rdom = $(), ri =0;
        this.map(function(ele){
            self.map(ele.childNodes, function(el){
                rdom[ri] = el;
                ri ++;
            });
        });
        rdom.length = ri;
        return rdom;
    }

    /**
     * 所有同辈
     * @param selector
     * @returns {*}
     */
    K.siblings = function(selector){
        selector = selector || '*';
        var rdom = $(), ri=0;
        this.map(this, function(ele){
            //同父级下所有直接子级（不包含自己）
            $.map(ele.parentNode.childNodes, function(el){
                if (el != ele && isSelectDom(el, selector)) {
					rdom[ri] = el;
					ri ++;
                }
            });
        });
		rdom.length = ri;
		return rdom;
    }

    /**
     * 父级
     * @param selector
     * @returns {*}
     */
    K.parent = function(selector){
        selector = selector || '*';
		var rdom = $(), ri=0;
        this.map(this, function(ele){
            var el = ele.parentNode;
            if (el != ele && isSelectDom(el, selector)) {
				rdom[ri] = el;
				ri ++;
            }
        });
		rdom.length = ri;
		return rdom;
    }

    /**
     * 祖先(直到匹配选择器)
     * @param selector
     * @returns {*}
     */
    K.parents = function(selector){
		var rdom = $(), ri=0;
		$.map(dir(this, 'parentNode', selector), function(el){
			rdom[ri] = el;
			ri ++;
		});
		rdom.length = ri;
        return rdom;
    }

	/**
	 * 前一个元素
	 * @param selector
	 * @returns {*}
	 */
	K.prev = function(selector){
        selector = selector || '*';
		var rdom = $(), ri=0;
        this.map(this,function(ele, i){
            if(isSelectDom(ele.previousElementSibling, selector)){
            	rdom[ri] = ele.previousElementSibling;
				ri ++;
			}
        });
		rdom.length = ri;
        return rdom;
    }

	/**
	 * 往前所有元素
	 * @param selector
	 * @returns {*}
	 */
	K.prevAll = function(selector){
		var rdom = $(), ri=0;
		$.map(dir(this, 'previousElementSibling', selector), function(el){
			rdom[ri] = el;
			ri ++;
		});
		rdom.length = ri;
		return rdom;
	}

	/**
	 * 下一个元素
	 * @param selector
	 * @returns {*}
	 */
    K.next = function(selector){
        selector = selector || '*';
		var rdom = $(), ri=0;
        this.map(this,function(ele){
            if(isSelectDom(ele.nextElementSibling, selector)){
				rdom[ri] = ele.nextElementSibling;
				ri ++;
			}
        });
		rdom.length = ri;
        return rdom;
    }

	/**
	 * 之后所有元素
	 * @param selector
	 * @returns {*}
	 */
	K.nextAll = function(selector){
		var rdom = $(), ri=0;
		this.map(dir(this, 'nextElementSibling', selector),function(ele){
			rdom[ri] = ele;
			ri ++;
		});
		rdom.length = ri;
		return rdom;
    }



// ====================== 事件处理 ====================== //
    var bindEventData = {}, __kid__ = 1;
    function KID(el){
        return el._ksaID || (el._ksaID = __kid__++);
    }
	/**
	 * 绑定事件
	 * @param event 事件名称, 每个事件以空格分开，每个事件支持命名空间click.xx
	 * @param selector
	 * @param callback
	 * @returns {$}
	 */
	K.on = function (event, selector, callback) {
		var self = this;
		if($.isFunction(selector) && !callback){
			callback = selector;
			selector = null;
		}
		callback = callback ? callback : function(){return false};

		return self.each(function (_, ele) {
			var kid = KID(ele);
			bindEventData[kid] = bindEventData[kid] || {};

			$.loop(event.split(/\s/), function (_, evn) {
				if (evn == 'ready'){
					return $(document).ready(callback);
				}
				var useCapture = false;

				var func = function(e){
					//如果存在子级选择器，则检查当前事件是被哪个元素触发 如在选择器范围内则回调函数
					if(selector){
						if(!$.inArray(e.target, ele.querySelectorAll(selector))){
							return;
						}
					}
					//回调函数并获取返回值，若返回值为false则阻止冒泡
					var r = callback.call(this, e);
					if(r === false){
						e.preventDefault();
						e.stopPropagation();
					}
					return this;
				};
				bindEventData[kid][evn] = bindEventData[kid][evn] || [];
				bindEventData[kid][evn].push({callback:callback, selector:selector, useCapture:useCapture, addCallback:func});
				/*
				addEventListener
				参数1 = 事件名称
				参数2 = 回调函数
				参数3 = true = 事件句柄在捕获阶段执行 false = 默认。事件句柄在冒泡阶段执行
				 */
				evn = evn.replace(/\..*/,'');

				ele.addEventListener(evn, func, useCapture);

			})
		})
	};

	/**
	 * 解除绑定事件
	 * @param event 事件名称 on绑定的事件名称
	 * @param callback
	 * @returns {$}
	 */
	K.off = function(event, callback) {
		var self = this, isCall = callback ? 1 : 0;
		callback = callback ? callback : function(){return false};
		return self.each(function (_, ele) {
			var kid = KID(ele);
			$.loop(event.split(/\s/), function (_, evn) {
				var evnDt = bindEventData[kid] && bindEventData[kid][evn] ? bindEventData[kid][evn] : null;

				evn = evn.replace(/\..*/,'');
				if(evnDt) {
					evnDt.map(function(val, i){
						if(!isCall || val.callback == callback){
							ele.removeEventListener(evn, val.addCallback, val.useCapture);
							delete bindEventData[kid][evn][i];
						}
					});

					ele.removeEventListener(evn, callback, evnDt.useCapture);
					$.isEmpty(bindEventData[kid][evn]) && delete bindEventData[kid][evn];
				}else{
					ele.removeEventListener(evn, callback, false);
					ele.removeEventListener(evn, callback, true);
				}
			})
			$.isset(bindEventData[kid]) && $.isEmpty(bindEventData[kid]) && delete bindEventData[kid];

		});
	};

    /**
     * hover事件
     * @param a
     * @param b
     * @returns {*}
     */
    K.hover = function(a, b){
        return this.mouseenter(a).mouseleave(b || a);
    }
// ====================== 当前或指定url格式化为对象 ====================== //
    K.urls = function(url){
    	var P = {}, u = [];
    	if(url){
			u = url.match(/(([a-z]+)\:\/\/)?([^:/]*?)(:(\d+)?)([^?]*)([^#]*)(#.*)?/i);
		}
		P = {
			url : url ? url : location.href,
			origin : url ? u[1] : location.origin,
			https : url ? u[2] : location.protocol,
			host : url ? u[3] : location.hostname,
			port : url ? u[5] : location.port,
			pathname : url ? u[6] : location.pathname,
			search : url ? u[7] : location.search,
			paths : [],
			get : {},
			hash : url ? u[8] : location.hash
		}
		if(P.search) {
			$.each(P.search.substr(1).split("&"),function(k,val){
				val = val.split('=');
				P.get[val['0']] = val['1'];
			});
		}
		if(P.pathname) {
			var pn = P.pathname;
			//去掉前后/
			pn = pn.replace(/^\/+/,'');
			pn = pn.replace(/\/+$/,'');
			$.each(pn.split("/"),function(k,val){
				P.paths[k] = val;
			});
		}
		return P;
	}

	/**
	 * 在url中添加一个参数
	 * @param url 需要添加的url
	 * @param query 参数：xxx=value
	 * @returns {string}
	 */
	K.urlsAdd = function(url, query){
    	return url + (url.indexOf('?') !== -1 ? '&' : '?') + query;
	}

	/**
	 * 将一个对象格式化为url参数，并做urlencode
	 * @param url
	 * @returns {*}
	 */
	K.urlsParam = function(url){
		if($.isObject(url) || $.isArray(url)){
			var u = [];
			$.each(url, function(key, value){
				u.push(encodeURIComponent(key) + "=" + encodeURIComponent(value == null ? "" : value));
			});
			url = $.implode('&',u);
		}
		return url;
	}

// ====================== AJAX ====================== //
	jsonpID = 1;
	/**
	 * ajax方法与jQuery基本一致
	 * 注：data值不再做任何二次处理，直接放入FormData提交，所以POST时支持文件与参数同时传递，无需其他设置
	 * @param option
	 */
    K.ajax = function(option){
		var getType = option.contentType ? option.contentType.toUpperCase() : 'GET',
			headers = option.headers || {},
			dataType = option.dataType ? option.dataType.toLowerCase() : 'html',
			jsonpCallback = option.jsonpCallback || '',
			jsonp = option.jsonp,
			responseData,
			_data = {};

		//JSONP直接创建script插入到dom后回调
		if(dataType =='jsonp'){
			//复制回调函数名
			var copyCallback = $.isFunction(jsonpCallback) ? ('jsonpCallback' + (jsonpID++)) : jsonpCallback;

			window[copyCallback] = function () {
				responseData = arguments;
			}
			option.url = $.urlsAdd(option.url,'jsonpCallback='+copyCallback);
			var script = document.createElement('script');
			script.src = option.url;
			script.type = 'text/javascript';
			$(script).on('load', function(e){
				var result = responseData[0];
				$(this).remove();

				if(jsonpCallback == copyCallback) {
					window[jsonpCallback] = window[jsonpCallback];
				}
				if (responseData && $.isFunction(jsonpCallback)){
					jsonpCallback.call(this, result);
				}

				if(e.type =='error'){
					$.isFunction(option.error) && option.error.call(this, result);
				}else{
					$.isFunction(option.success) && option.success.call(this, result);
				}
			});
			document.head.appendChild(script);
			copyCallback = responseData = null;

		//其他ajax请求采用XMLHttp
		}else{

			if(getType =='POST'){
				_data = new FormData();
				$.each(option.data, function(k, val){
					_data.append(k, val);
				});
			}else if(getType =='GET'){
				_data = $.urlsParam(option.data);
				option.url = $.urlsAdd(option.url, _data);
				_data = '';
			}

			var A = new XMLHttpRequest();

			A.open(getType, option.url,true);

			$.each(headers, function(k, val){
				A.setRequestHeader(k,val);
			});

			A.send(_data);

			A.onreadystatechange = function(){
				var result = A.responseText;
				if(A.readyState == 4 && A.status == 200) {
					if (dataType == 'script'){
						(1,eval)(result);
					}else if(dataType == 'xml'){
						result = A.responseXML;
					}else if (dataType == 'json'){
						result = /^\s*$/.test(result) ? null : JSON.parse(result);
					}
					$.isFunction(option.success) && option.success.call(this, result);
				}else{
					$.isFunction(option.error) && option.error.call(this, result);
				}
			}
		}
    }
// ====================== 元素监听 ====================== //

	/**
	 * 对象变量名分割为主变量名 索引名
	 * 例：
	 * data.user[1] = [data.user, 1]
	 * data.user = [data, user]
	 * @param kname 需要处理的变量名
	 * @returns {[string, string]}
	 */
	K.keyNameMap = {};
	/**
	 *
	 * @param kname
	 * @param isOne 数组第一个只返回第一个变量名
	 * @returns {*}
	 */
	K.keyName = function(kname, isOne){
		var kmapI = kname+'{'+isOne+'}';
		if(!this.keyNameMap[kmapI]) {
			var keys = '', p = kname;
			/*
			kname.replace(/^([\w\d\$]+)((\[\d+\])+|((\.([\w\d\$]+))+))$/i, function () {
				debug(arguments);
				keys = arguments[4] || arguments[3];
				p = arguments[1];
			});
			 */
			var dn = !isOne ? kname.lastIndexOf('.') : kname.indexOf('.'), qn =0;
			if(dn === -1){
				qn = !isOne ? kname.lastIndexOf('[') : kname.indexOf('[');
			}
			var vlast = Math.max(qn, dn);
			if(vlast >0){
				p = kname.substr(0,vlast);
				keys = kname.substr(dn>0 ? vlast+1 : vlast);
			}
			this.keyNameMap[kmapI] = [p, keys, kname];
		}
		return this.keyNameMap[kmapI];
	}

	/**
	 * 变量监听函数
	 */
	K.def = function(){
		return {
			ths : null,
			updIndex : 0,
			updMap : {},
			DelEvent : {object:[],func:[]},
			AddEvent : {object:[],func:[]},
			/**
			 * 全局更新函数
			 * @param inobj this指向
			 * @param func
			 */
			upd : function(inobj, func){
				var i = this.updIndex ++;
				this.updMap[i] = function(){
					return func.apply(inobj, arguments);
				}
			},
			/**
			 * 变量监听 虚拟dom引擎TPC2使用
			 * @param obj
			 * @param keyName
			 * @param setFun
			 * @param getFun
			 * @private
			 */
			set : function(obj, keyName, setFun, getFun){
				var ths = this;
				if(!$.isObject(obj) || !keyName || !setFun){
					return;
				}

				var setTer = Object.getOwnPropertyDescriptor(obj, keyName);
				setTer = setTer ? setTer.set : setTer;
				var setFunction = function(v){
					setTer && setTer(v);
					setFun(v);
				};


				try {
					var _Svalue = obj[keyName];
					Object.defineProperty(obj, keyName, {
						enumerable: true,
						configurable: true,
						set : function(v){
							if(v === _Svalue){//值相同时不回调函数
								return;
							}
							//回调处理做延迟 以达到值写入成功后再回调
							window.setTimeout(function(){
								$.loop(ths.updMap, function(_, fun){
									if(fun(v, _Svalue) !== true){
										delete ths.updMap[_];
										//debug('删除当前监听回调')
									}
								});
								setFunction(v);
							},0);

							_Svalue = v;
						},
						get : function(v){
							return _Svalue;
						}
					});
				}catch (e) {

				}

			},
			del : function(obj, func, tothis){
				this.DelEvent.object.push(obj);
				this.DelEvent.func.push(function(){
					func.call(tothis);
				});
			},
			add : function(obj, func, tothis){
				this.AddEvent.object.push(obj);
				this.AddEvent.func.push(function(){
					func.apply(tothis, arguments);
				});
			},
		}
	}

	/**
	 * 创建匿名回调函数解析模板实际值
	 * @param evalCode 需要解析的js
	 * @param {object} addVariables 附加回调参数 键名=参数名 键值=回调值
	 */
	K.eval = function(evalCode, addVariables){
		if(!evalCode){
			return;
		}
		var __vkey = addVariables ? Object.keys(addVariables).join(',') : '';
		var __vValue = addVariables ? Object.values(addVariables) : [];
		var funCode = 'function _Vcall('+__vkey+'){ return '+evalCode+'}';
		eval(funCode);
		return _Vcall.apply('', __vValue);
	}

// ====================== 元素监听 ====================== //
	K.V = function(val){
		return val === undefined ? '' : val;
	}

	/**
	 * 获取调用此函数的参数名与参数值
	 * @param Args
	 */
	K.getIncludeFunc = function(Args){
		var argsNames = Args.callee.toString().match(/^function(\s[^(]+)?\(([^\)]+)?\)\{/);
		if(argsNames && argsNames[2]) {
			var dt = {};
			argsNames = $.explode(',', argsNames[2], ' ');
			$.loop(argsNames, function (k, v) {
				v = v.trim();
				dt[v] = Args[k];
			});
			return dt;
		}
	}

	K.tpl = function(_DATA){
    	var self = this;
		//匹配模板变量正则 {xxx}
		var variableReg = /\$\{((?:.|\r?\n)+?)\}/g;
		//匹配js变量名正则
		var varsNameRegx = /(([\u4e00-\u9fa5_a-zA-Z$]+([\u4e00-\u9fa5_a-zA-Z0-9$]+)?)(((\[[0-9]+\])+|(\.[\u4e00-\u9fa5_a-zA-Z$][\u4e00-\u9fa5_a-zA-Z$0-9]+))+)?)(\.(charAt|charCodeAt|concat|fromCharCode|indexOf|includes|lastIndexOf|match|repeat|replace|search|slice|split|startsWith|substr|substring|toLowerCase|toUpperCase|trim|toLocaleLowerCase|toLocaleUpperCase|valueOf|toString|anchor|big|blink|bold|fixed|fontcolor|fontsize|italics|link|small|strike|sub|sup)\(.*?\))?/g;


		/**
		 * 对象变量名解析为格式化字符
		 * Author: cr180
		 *
		 * 如：
		 * xxx			= [xxx, xxx, '']
		 * xxx.name 	= [xxx, xxx, name]
		 * xxx[1].name 	= [xxx, xxx[1], name]
		 * xxx.list[1]	= [xxx, xxx.list, 1]
		 * @param {string} vars 需要解析的变量名字符串 xxx.name / xxx[1].name / xxx.list[1]
		 * @returns {array} [祖先变量名 , 主变量名, 结束变量名]
		 */
		function variableNameEx(vars){
		    if(!vars){
		        return [];
            }
			vars = strTovars(vars.toString(),true);
			var lk  = vars.indexOf('[');
			var ld = vars.indexOf('.');
			var fk = vars.lastIndexOf('[');
			var fd = vars.lastIndexOf('.');
			var lastOF = Math.max(fd, fk);

			var ancestor = vars; firstName = vars, lastName = '';

			//提取最后一个键名
			if(lastOF !== -1){
				ancestor = strTovars(vars.substr(0, (lk >0 && ld >0 ? Math.min(lk,ld) : Math.max(lk,ld))), true);
				firstName = vars.substr(0, lastOF);

				//如果最后是[] 则取括号中间的字符 否则取.之后的字符
				lastName = fk > fd ? vars.substring(lastOF+1, vars.lastIndexOf(']')) : vars.substr(lastOF+1);
			}
			return [ancestor, firstName, lastName];
		}
		var Tpc = {
			E : '', //前台渲染区DOM对象
			data : _DATA,
			Dom : '', //虚拟节点
			VDOM : {},
			EVALVARS : '',
			$dataMap : {},
			createdata : function($dt, parentKEY){
				var ths = this;
				$.loop($dt, function(key, value){
					var inKey;
					if($.isNumber(key)){
						inKey = parentKEY ? (parentKEY+'['+key+']') : key;
					}else{
						inKey = parentKEY ? (parentKEY+'.'+key) : key;
					}

					ths.$dataMap[inKey] = '1';
					if($.isObject(value) || $.isArray(value)){
						ths.createdata(value, inKey);

					}
				});
			},
			init : function(ele){


				this.E = ele;

				this.createdata(this.data);//创建传入数据的索引

				this.VDOM = this.replace(); //替换语法生成内部HTML
				this.VDOM = this.createVDOM(this.Dom); //内部HTML转为DOM节点并生成虚拟DOM

                delete this.Dom; //删除虚拟节点 释放内存
				//模板语法生成js 解析代码
                this.EVALVARS = this.createVDOMcode(this.VDOM);
				//执行js解析代码并填充到虚拟DOM
                this.parseVDOMcode();
                //监听变量变更
                //this.monitor(this.VDOM);

				//虚拟DOM对应生成元素节点
                this.createDom(this.VDOM);
                //虚拟DOM push到页面
                this.pushDom(this.VDOM);
                this.parseIf(this.VDOM);

			},
			def : self.def(),
			/**
			 * 模板变量转为实际变量
			 * @param variable 变量字符串
			 * @param isReturnStr 是否只需要返回解析后的变量字符串
			 * @returns {*}
			 */
			strTovarsMap : {},
			strTovars : function(variable, isReturnStr){
				var ths = this;
				var vars, returnStr = variable;
				var map = this.strTovarsMap;
				if(variable && map[variable]){
					returnStr = map[variable][0];
					vars = map[variable][1];
				}else {

					if (!variable) {
						returnStr = '_DATA';
						vars = _DATA;
					} else {
						//先从局部变量中匹配
						try {
							returnStr = '_DATA.' + variable;
							vars = ths.eval(returnStr);
							if (vars === undefined) {
								returnStr = variable;
								vars = ths.eval(variable);
							}
						} catch (e) {
							returnStr = variable;
							try {
								vars = ths.eval(variable);
							} catch (e) {
							}
						}
						this.strTovarsMap[variable] = [returnStr, vars];
					}

				}
				return isReturnStr ? returnStr : vars;
			},
            /**
             * 创建匿名回调函数解析模板实际值
             * @param evalCode 需要解析的js
             * @param {object} addVariables 附加回调参数 键名=参数名 键值=回调值
             */
			eval : function(evalCode, addVariables){
				addVariables = addVariables || {};
				addVariables._DATA = this.data;

                return $.eval(evalCode, addVariables);
            },
			//模板语法格式化为符合内部要求的语法
			replace : function(){
				var code = this.E.innerHTML;
				code = code.replace(/\{loop ([^\\]+?)\}/ig, '<ksa loop><ksafactor>$1</ksafactor><ksaloopline>');
				code = code.replace(/\{if ([^\\]+?)\}/ig, '<ifscope><ksa if><ksafactor>$1</ksafactor>');
				code = code.replace(/\{(elseif) ([^\\]+?)\}/ig, '</ksa><ksa $1><ksafactor>$2</ksafactor>');
				code = code.replace(/\{else\}/ig, '</ksa><ksa else>');

				code = code.replace(/\{\/if\}/ig, '</ksa></ifscope>');
				code = code.replace(/\{\/loop\}/ig, '</ksaloopline></ksa>');

				code = code.replace(/\{eval\}/ig, '<ksaeval>');
				code = code.replace(/\{\/eval\}/ig, '</ksaeval>');
				code = code.replace(/\{eval ([\s\S]*?)\}/ig, '<ksaeval>$1</ksaeval>');
				this.Dom = $.dom(code);
				return this;
			},
			createDomLoop : function(ele, tree, eleKey, parentKey){
            	var ths = this,
					loopN = 0,
					farr = $.explode(' ', tree.factor, '');

            	function __defdel(key, dt){
					//监听 变量被删除
					ths.def.del(dt, function(){
						var ts = this,
							chil = ts.children[key];
						if(!chil){
							return;
						}
						var num = $.count(this.children),
							chilnodes = chil.ele._childNodes,
							length = chilnodes.length;
						$.loop(chilnodes, function(i, e){
							e = $(e);
							if(i === length-1){
								ts.ele = document.createComment('');
								e.after(ts.ele);
							}
							e.remove();
						})
						delete ts.children[key]; //删除当前VDOM
						//如果当前子级删除后为空
						ts.isEmpty = num === 1;
					}, tree);
				}

				var loopData = ths.strTovars(farr[0]);
				tree.children = {};
				$.loop(loopData, function(k, value, _i1){
					var d = {};
					d[farr[1]] = k;
					d[farr[2]] = value;
					var sk = $.isNumber(k) ? (farr[0]+'['+k+']') : (farr[0]+'.'+k);

					var _n = '_'+_i1;
					//生成VDOM时 节点内只有一个ksaloopline标签 所以针对性单独处理
					var t = ths.createVDOM(ele.childNodes, (parentKey+eleKey), d, [sk, k, [farr[1],farr[2]], _i1])[_n];
					tree.children[_n] = t;
					__defdel(_n, value);
					loopN ++;
				});
				//loop为空
				if(!loopN){
					tree.isEmpty = true;
				}

				//监听 子变量添加
				ths.def.add(loopData, function(key, dt){
					var _n = '_'+key;
					var d = {};
					d[farr[1]] = key;
					d[farr[2]] = dt;
					//找到当前节点最后一个
					var end;

					if(this.isEmpty){
						end = this.ele;
					}else{
						$.loop(this.children, function(_, e){
							end = e;
						});
						end = end.ele._childNodes[end.ele._childNodes.length -1];
					}
					var sk = $.isNumber(key) ? (farr[0]+'['+key+']') : (farr[0]+'.'+key);

					this.children[_n] = ths.createVDOM(ele.childNodes, (parentKey+eleKey), d, [sk, key, [farr[1],farr[2]], key])[_n];
					var dom = ths.createDom([this.children[_n]]);

					$(end).after(dom);
					if(this.isEmpty){
						$(end).remove();
						this.isEmpty = false;
					}
					ths.parseIf(this.children[_n].children);
					__defdel(_n, dt);
				}, tree);
			},
			/**
			 * 创建虚拟DOM
			 * @param eleList 节点列表
			 * @param parentKey 父级键名
			 * @param data 参与渲染的数据
			 * @param addKeyName 参与渲染的数据键名
			 * @returns {{}}
			 */
            createVDOM : function(eleList, parentKey, data, addKeyName){
                parentKey = parentKey ? parentKey+'.children.' : '';
                var ths = this;
                var newTree = {};

                $.loop(eleList, function(eleKey, ele){
                    if(ele.tagName ==='KSAFACTOR') {
                        return ;
                    }
                    //针对loop循环兼容
                    if(ele.tagName ==='KSALOOPLINE'){
                    	eleKey = addKeyName[3];
					}
                    eleKey = '_'+eleKey;
                    var tree = {
                        tag : ele.tagName ? ele.tagName.toLowerCase() : '', //标签名小写 文本节点为空
                        nodeType: ele.nodeType, //节点类型
						dataKey : addKeyName, //当前节点用到的数据键名
						renderFunction : [], //渲染节点时需要执行的回调函数列表
                        eleKey : parentKey+eleKey,
                        variables : {}, //当前节点使用的变量值
                        //返回父级树
                        parent : function(){
                            var n = this.eleKey.lastIndexOf('.children.');

                            var a = this.eleKey.substr(0,n);
                            return ths.__thisObject(a);
                        },
                        //返回后一个树
                        next : function(){
                            var n = eleKey.lastIndexOf('.');
                            var a = eleKey.substr(0,n);
                            var b = eleKey.substr(n+1);
                            var bn = parseInt(b.substr(1))+1;
                            return ths.__thisObject((n>0 ? (a + '.') : '') +'_' + bn);
                        },
                        //取前一个树
                        prev : function(){
                            var n = eleKey.lastIndexOf('.');
                            var a = eleKey.substr(0,n);
                            var b = eleKey.substr(n+1);
                            var bn = parseInt(b.substr(1))-1;
                            if(bn >=0){
                                return ths.__thisObject(a + '._' + bn);
                            }
                        }
                    };

                    //文本节点
                    if(ele.nodeType === 3 || ele.nodeType === 8){
                        tree.text = ele.nodeValue;
                        var exp = ths.parseText(tree);
                        if(exp){
                            //文本节点解析结果
                            if(exp.parseCode){
                                tree.parseCode = exp.parseCode;
                            }
                            //节点中使用了哪些变量
                            if(exp.variableList){
                                tree.variableList = exp.variableList;
                            }
                        }
                    }

                    //遍历属性名
                    if (ele.attributes && ele.attributes.length) {
                        var attrs = {};
                        $.map(ele.attributes, function (v) {
                            //判断与循环标签的处理
                            if($.inArray(v.name, ['if','elseif','else','loop'])){
                                tree.tag = v.name; //标签名为条件名
                                if(v.name !='else' && ele.childNodes[0].tagName === 'KSAFACTOR') {//增加判断条件 条件值=第一个子级html
                                    tree.factor = ele.childNodes[0].innerHTML;
                                }
                            }else{
                                attrs[v.name] = v.value;
                            }
                        });
                        if(Object.keys(attrs).length){
                            tree.attrs = attrs;
                        }
                        attrs = null;
                    }
					if(tree.tag ==='ksaeval'){
						tree.eval = ele.innerHTML;
					}else if(tree.tag =='loop'){//循环节点单独创建VDOM树
                        ths.createDomLoop(ele, tree, eleKey, parentKey);

                    //如果存在子节点则遍历
                    }else if(ele.childNodes && ele.childNodes.length){
                        tree.children = ths.createVDOM(ele.childNodes, (parentKey+eleKey), data);
                        //增加取所有子级函数
                        tree.childrenAll = function(callFun){
                            var ths = this;
                            if(!ths.children || !callFun){
                                return;
                            }
                            function f(el){
                                callFun.call(this, el);
                                if(el.children){
                                    $.loop(el.children, function(_, e){
                                        f(e);
                                    });
                                }
                            }
                            $.loop(ths.children, function(_, e){
                                f(e);
                            });
                        };
                    }
                    newTree[eleKey] = tree;
                    tree = null;
                });

                return newTree;
            },
			/**
			 * 统一解析VDOM虚拟树中的变量
			 */
			parseVDOMcode : function(){
				var ths = this;
				var _VM = this.VDOM;

				//变量回调解析
				function _E(){
					var tree = arguments[0], //需要渲染的vdom
						intdt = arguments[1]; //渲染的数据结果
					if($.inArray(tree.tag,['if','elseif'])){//给if节点加上解析结果
						tree.factorResult = intdt;
					}else{
						tree.text = intdt;
						if(tree.ele && (tree.ele.nodeType ===3 || tree.ele.nodeType ===8)){
							tree.ele.nodeValue = intdt;
						}
					}
				}

				//虚拟DOM树解析函数
				function _F(tree, Efunc){
					Efunc.call('', tree);
					tree.renderFunction.push(Efunc);
				}

				/**
				 * 变量监听绑定函数
				 *
				 * 每个需要监听的对象键名都交给monitor
				 *
				 * @param tree 对应VDOM树
				 * @param obj 需要监听的对象
				 * @param objKey 需要监听的键名
				 */
				function _M(tree, obj, objKey){
					ths.monitor.set(obj, objKey, func); //待完成
				}


				//===================================================
				var __data = this.data,
					__vkey = __data ? Object.keys(__data).join(',') : '',
					__vValue = __data ? Object.values(__data) : [];
				var Evcode = "function _Vcall("+__vkey+"){\n "+this.EVALVARS+"}";

				eval(Evcode);
				_Vcall.apply('', __vValue);
			},
			//DOM树转执行语句
			_createVDOMcode : function(tree, inputCode){
            	if(inputCode ==='' || typeof(inputCode) == 'undefined'){
					inputCode = "''";
				}
            	var treeKey = "_VM."+tree.eleKey;
				var Rcode = "_F("+treeKey+", function(){\n";
				Rcode += "_E(arguments[0], ("+inputCode+"));\n";
				//添加监听
				$.loop(tree.variableList, function(vname, skv){
					if($.isObject(skv)){
						Rcode += "_M(arguments[0], "+vname+", '"+Object.keys(skv).join(',')+"');\n";
					}
				});
				Rcode += "});\n";
				return Rcode;
			},
			//创建虚拟DOM 语法解析代码
			createVDOMcode : function(treeList){
				var ths =  this;
				var evalStrings = [];
				$.loop(treeList,function(treeKey, tree){

					var inputCode = '';
					//区域解析 loop 特殊声明等 Start
					if(tree.dataKey && tree.dataKey.length){
						inputCode += '(function('+tree.dataKey[2].join(', ')+'){'+"\n";
					}
					if(tree.nodeType === 3 || tree.nodeType === 8){
						if(tree.parseCode){
							inputCode += ths._createVDOMcode(tree, tree.parseCode);
						}
					}else if(tree.tag ==='ksaeval' && tree.eval){
						inputCode += tree.eval+"\n";
					}else if(tree.nodeType === 1){

						if(tree.children){
							inputCode += ths.createVDOMcode(tree.children);
						}
					}
					//if条件的解析
					if($.inArray(tree.tag, ['if','elseif'])){
						inputCode += ths._createVDOMcode(tree, tree.factor);
					}


					//区域解析 loop 特殊声明等 END
					if(tree.dataKey && tree.dataKey.length){
						inputCode += '}).call("","'+tree.dataKey[1]+'", '+tree.dataKey[0]+');'+"\n";
					}

					evalStrings.push(inputCode);
				});

				evalStrings = evalStrings.join("");

				return evalStrings;
				/*
				var ths = this;
				$.loop(treeList,function(_, tree){
					var nodeType = tree.nodeType;

					if((nodeType === 3 || nodeType === 8) && tree.parseCode) {
						tree.text = tree.parseCode ? ths.eval(tree.parseCode, tree.data) : tree.text;

						//节点变量监听
						$.loop(tree.variableList, function(_, val){
							val = $.keyName(val);
							if(!val[1]){
								return;
							}
							ths.def.set(ths.strTovars(val[0]), val[1], function(){
								tree.ele.nodeValue = ths.eval(tree.parseCode, tree.data);
							});
						});
						$.loop(tree.data, function(_, val){
							$.loop(val, function(kn){
								ths.def.set(val, kn,function(){
									tree.ele.nodeValue = ths.eval(tree.parseCode, tree.data);
								});
							});
						});

					}

					if(tree.children){
						ths.createVDOMcode(tree.children);
					}
				});
				*/
			},

			//待监听的变量数据 一组一个对象， 每组下{obj:监听对象, keys:{监听键名:[setFunction1, setFunction2, setFunction3, ...]}}
			monitorMap : [],
			//监听变量变更
			monitor : function(obj, objKey){
            	var ths = this;

            	/*
				$.loop(treeList,function(treeKey, tree){
					var nodeType = tree.nodeType;
					//文本节点
					if((nodeType === 3 || nodeType === 8) && tree.parseCode) {
						var nodeFunc = function(){
							$.loop(tree.renderFunction, function(_, f){
								f(tree);
							});
						};

						$.loop(tree.variableList, function(vname, valKey){
							if(tree.data && vname){
								var treeDt = tree.data[vname];

								if(treeDt && $.isObject(treeDt)) {
									var insetStatus = 0;
									$.loop(ths.monitorMap, function (__, lithen) {
										if (lithen.obj === treeDt) {
											if ($.isObject(valKey)) {
												$.loop(valKey, function (vk) {
													if (lithen.keys[vk]) {
														lithen.keys[vk].push(nodeFunc);
													}
												});
											} else if (!lithen.keys[vname]) {
												lithen.keys[vname] = [nodeFunc];
											}
											insetStatus = 1;
										}
									});
									if (!insetStatus) {
										var inadd = {obj: treeDt, keys: {}};
										if ($.isObject(valKey)) {
											$.loop(valKey, function (vk) {
												inadd.keys[vk] = inadd.keys[vk] ? inadd.keys[vk] : [];
												inadd.keys[vk].push(nodeFunc);
											});
										} else if (!inadd.keys[vname]) {
											inadd.keys[vname] = [nodeFunc];
										}

										ths.monitorMap.push(inadd);
									}
								}
							}
						});


						//节点变量监听
						$.loop(tree.variableList, function(_, val){
							val = $.keyName(val);
							if(!val[1]){
								return;
							}
							ths.def.set(ths.strTovars(val[0]), val[1], function(){
								tree.ele.nodeValue = ths.eval(tree.parseCode, tree.data);
							});
						});
						$.loop(tree.data, function(_, val){
							$.loop(val, function(kn){
								ths.def.set(val, kn,function(){
									tree.ele.nodeValue = ths.eval(tree.parseCode, tree.data);
								});
							});
						});

					}
					if(tree.children){
						ths.monitor(tree.children);
					}
				});
				*/
			},
            /**
             * 根据虚拟DOM创建节点
             * 此环节 变量语法等还未解析
             */
            createDom : function(treeList){
                var ths = this;
                var Vdom = newFragment();
                $.loop(treeList,function(_, tree){
                	if(tree.tag =='ksaeval'){
                		return;
					}
                    var nodeType = tree.nodeType;
                    var dom;
                    if(nodeType === 3 || nodeType === 8){
                        dom = nodeType === 3 ? document.createTextNode(tree.text) : document.createComment(tree.text);

                    }else{
                        if($.inArray(tree.tag, ['if','elseif','else','loop','ifscope','ksa','ksaloopline'])) {
                            dom = newFragment();

                        }else{
                            dom = document.createElement(tree.tag);
                            if(tree.attrs){
                                $.each(tree.attrs, function(k, v){
                                    dom.setAttribute(k, v);
                                });
                            }
                        }
                        if(tree.tag === 'loop' && tree.isEmpty){
							dom = document.createComment('');
						}else if(tree.children){
                            var subdom = ths.createDom(tree.children);
                            dom.appendChild(subdom);
                        }
                    }

                    if(dom) {
						if(dom.childNodes){
							dom._childNodes = [].slice.call(dom.childNodes);
						}
                        tree.ele = dom;
                        Vdom.appendChild(dom);
                    }
                });

                return Vdom;
            },
			/**
			 * 节点push到前台后 IF节点的处理
			 * @param treeList
			 */
			parseIf : function(treeList){
            	var ths = this;
            	function ifCalc(tree){
					var ifR = false;
					var deleteEles = [];//待删除节点列表
					var accordTree; //符合条件的节点
					if(!tree.comNode) {
						//创建虚拟节点
						tree.comNode = document.createComment('');
					}
					$.loop(tree.children, function(_, t){
						var r = false;
						if(t.tag !='else') {
							r = t.factorResult;
							if(r){
								ifR = r;
								if(!accordTree){
									accordTree = t;
								}
							}
						}
						//如果是else 并且整个域没有符合的条件 则展示else节点
						if(t.tag ==='else' && !ifR){
							r = true;
						}
						if(!r){
							//整理待删除列表 待删除的节点必须是已存在于前台dom中
							$.loop(t.ele._childNodes, function(_k, t1){
								if(!$.inArray(document.compareDocumentPosition(t1), [35, 37])) {
									deleteEles.push(t1);
								}
							})
						}
					});

					//如果整个节点没有符合的条件 则创建一个占位节点
					if(!ifR && !tree.comNodePush){
						$(tree.ele._childNodes[0]).before(tree.comNode);
						tree.ifscopePushDom = [tree.comNode];
						tree.comNodePush = true;
					//如果当前条件成立 但节点为占位节点时 用真实节点替换占位节点
					}else if(ifR && tree.comNodePush){
						$(tree.comNode).before(accordTree.ele._childNodes).remove();
						tree.comNodePush = false;
					//如果当前条件成立 且占位节点不存在 用新节点替换原节点
					}else if(ifR && !tree.comNodePush){
						$(deleteEles[0]).before(accordTree.ele._childNodes);
					}

					$.loop(deleteEles, function(_, e){
						$(e).remove();
					});

					return ifR;
				}

				$.loop(treeList,function(_, tree){
					if(tree.tag ==='ifscope'){
						ifCalc(tree);
						ths.def.upd(tree, function(){
							ifCalc(tree);
							return true; //一直监听
						});

					}else if(tree.children){
						ths.parseIf(tree.children);
					}
				});
			},
            /**
             * 将虚拟DOM写入到前台DOM
             */
            pushDom : function(){
                var E = $(this.E);
                E.empty();
                var Vdom = newFragment();
                $.loop(this.VDOM, function(_, e){
                    Vdom.appendChild(e.ele);
                });
                E.html(Vdom);
            },
			/**
			 * DOM树 键名字符串转对象
			 * @param key
			 * @returns {*}
			 * @private
			 */
			__thisObject : function(key){
				var r;
				try {
					r = eval('this.VDOM.'+key);
				}catch (e) {

				}
				return r;
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
			parseText : function  (tree) {

			    var ths = this, text = tree.text;
			    if(!text.trim()){
			        return;
                }

			    if(ths.parseTextIndex[text]){
			        return ths.parseTextIndex[text];
                }

				var tagRE = variableReg;
				var parseCode = [];
				var variableList = {};
				var lastIndex = tagRE.lastIndex = 0;
				var match, index;
				while ((match = tagRE.exec(text))) {
					index = match.index;
					if (index > lastIndex) {
						parseCode.push('"' + text.slice(lastIndex, index) + '"');
					}
					var kname = match[1].trim();
					$.loop(ths.extractParamName(kname), function(k, v){
						var skv = $.keyName(v,1);
						if(skv[1]){
							variableList[skv[0]] = variableList[skv[0]] ? variableList[skv[0]] : {};
							variableList[skv[0]][skv[1]] = 1;
						}else{
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
				if(parseCode) {
					parseCode = parseCode.replace(/(\r\n|\r|\n)/g, function(_1){
						return _1 ==="\r\n" ? '\\r\\n' : (_1 ==="\r" ? '\\r' : '\\n');
					});
				}
                ths.parseTextIndex[text] = {parseCode:parseCode, variableList:variableList};
                return ths.parseTextIndex[text];
			},
		};

        //初始化模板语法
        this.map(function(ele){
            Tpc.init(ele);
        });


        return {
            OBJECT : Tpc,
        	data : _DATA,
            VDOM : Tpc.VDOM,
            del : function(obj){
                var evn = Tpc.def.DelEvent;
                $.loop(evn.object, function(key, o){
                    if(o === obj){
                        evn.func[key]();
                    }
                });
                delete obj;
            },
            add : function(obj, addkey, data){
                obj[addkey] = data;
                var evn = Tpc.def.AddEvent;
                $.loop(evn.object, function(key, o){
                    if(o === obj){
                        evn.func[key](addkey, data);
                    }
                });
            }
        };


	}

// ====================== 判断与重写函数类 ====================== //
	K.isWindow = function isWindow(obj) {
		return obj != null && obj === obj.window;
	};

    K.isDocument = function(obj){
        return obj != null && obj.nodeType == obj.DOCUMENT_NODE;
    }

	K.isArray = function(){
		return v && v.constructor == Array;
	}

	/**
	 * 模拟php isset
	 * @param key
	 * @param str 指定需要检测的字符串 可选
	 * @returns {boolean}
	 */
	K.isset = function(key, str){
        if(str !== undefined){
            return key.indexOf(str) === -1;
        }else{
            return typeof(key) !== 'undefined';
        }
	}
	K.isTrue = function(v) {
		return v === true;
	}
	K.isFalse = function(v) {
		return v === false;
	}
	K.isArray = function(v){
		return v && v.constructor == Array;
	}
    K.isArrayLike = function(obj) {

        // Support: real iOS 8.2 only (not reproducible in simulator)
        // `in` check used to prevent JIT error (gh-2145)
        // hasOwn isn't used here due to false negatives
        // regarding Nodelist length in IE
		if ($.isFunction(obj) || $.isWindow(obj) || $.isString(obj)) {
			return false;
		}

        var length = !!obj && "length" in obj && obj.length, type = typeof(obj);

        return type === "array" || length === 0 ||
            typeof length === "number" && length > 0 && (length - 1) in obj;
    };
	K.isNumber = function(v){
		return v && /^[0-9]+$/.test(v.toString());
	}

	K.isBool = function(v){
		return typeof(v) === 'boolean';
	}

	K.isObject = function(v){
		return v && typeof(v) === 'object';
	}

	K.isObjectPlain = function(v) {
		return $.isObject(v) && !$.isWindow(v) && Object.getPrototypeOf(v) === Object.prototype;
	}

	K.isString = function(v){
		return typeof(v) === 'string';
	}
	K.isFunction = function(v){
		return v && typeof(v) === 'function';
	}

	K.isWindow = function(v) {
		return v != null && v === v.window;
	}

	K.isEmpty = function(v=[]){
		if($.isObject(v) || $.isArray(v)){
			for(var s in v) {
				if(v !== undefined){
					return false;
				}
			}
			return true;
		}else{
			return v === '' || v === 0 || v ==='0' || v === false || v === null || v === undefined;
		}
	}
	K.isDomAll = function(dom){
		return dom instanceof HTMLElement || dom instanceof Node || dom instanceof XMLDocument || dom instanceof  NodeList
	}

	K.isNull = function(v){
		return v === null;
	}
	K.inArray = function(val,dt, rkey){
		var S = false;
		$.loop(dt,function(k,v){
			if(val === v){
				S = rkey ? k : true;
				return true;
			}
		});
		return S;
	}
	K.count = function(dt){
		var S = 0;
		$.each(dt,function(){
			S ++;
		});
		return S;
	}
	K.arrayMerge = function(){
		var arr = arguments[0] || {};
		$.each(arguments, function(key, value){
			if(key > 0){
				$.each(value,function(k, val){
					arr[k] = val;
				});
			}
		});
		return arr;
	}

	/**
	 * 字符串转数组
	 * @param ft 分隔符
	 * @param str 需要转换的字符串
	 * @param notemp 需要排除的值
	 * @returns {[]}
	 */
	K.explode = function(ft, str, notemp){
		str = ft && str ? str.toString().split(ft) : [];
		//如果需要排除空值
		if($.isset(notemp)){
			var news = [], i =0;
			$.each(str, function(_, v){
				if(v != notemp){
					news[i] = v;
					i ++;
				}
			});
			str = news;
		}
		return str;
	}
	K.implode = function(n, arr){
		var s = '', str = '';
		for(k in arr){
			str += s+arr[k];
			s = n;
		}
		return str;
	}
	K.unset = function(dt,keys){
		keys = $.explode(' ', keys);
		var newDt = {};
		$.each(dt,function(k, v){
			if(!$.inArray(k,keys)){
				newDt[k] = v;
			}
		});
		if($.isArray(dt)){
			newDt = Array.from(newDt);
		}
		return newDt;
	}

    K.trim = function(str, char){
        str = str.toString();
        if(!char){
            str = str.replace(new RegExp('^\\'+char+'+', 'g'),'');
            str = str.replace(new RegExp('\\'+char+'+$', 'g'),'')
        }else{
            str = str.trim();
        }
        return str;
    }

	K.loop(('blur focus focusin focusout resize scroll click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup contextmenu').split(' '),function (i, name) {
		K[name] = function(func, fn) {
			return this.on(name, null, func, fn);
		};
	});
	
	window.KSA = window.$ = $;


	/**
	 * 兼容 AMD 模块
	 **/
	if (typeof define === 'function' && define.amd) {
		define('KSA', [], function() {
			return $;
		});
	}
	return $;
})(document);