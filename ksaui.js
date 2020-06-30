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

(function(document, undefined) {



	function array2object(arr){
		var obj = {};
		for(var k in arr){
			obj[k] = arr[k];
		}
		return obj;
	}

	/**
	 * 字符串转虚拟dom
	 * @param code
	 * @returns {ActiveX.IXMLDOMNodeList | NodeListOf<ChildNode>}
	 */
	function createDom(code){
		//创建虚拟dom并写入字符串
		dom = document.createRange().createContextualFragment(code);
		//返回虚拟dom中生成的节点
		var doms = [];
		dom.childNodes.forEach(function(ele){
			doms.push(ele);
		});
		return doms;
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
	    if(code instanceof _A){
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
		return new $.S.A(selector);
	}

	$.S = $.__proto__ = {
		version : '1.0'
	};

	var _A = $.S.A = function(selector){
		var self = this;
		if(selector) {
			if (selector instanceof _A) {
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

	_A.prototype = $.S;

    $.S.ready = function(callback) {
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
	$.S.dom = function(code){
		return createDom(code);
	}
// ====================== 文档操作 ====================== //

	/**
	 * 添加class
	 * 最后更新 : 2020年6月19日 20:01:50
	 * @param name 需要添加的class值，多个以空格分割
	 * @returns {$}
	 */
	$.S.addClass = function(name){
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
	$.S.removeClass = function(name){
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

	$.S.isAttr = function (key) {
		key = $.explode(' ', key, '');

		for(var k in key){
			if(this[0].getAttribute(key[k]) !== null){
				return true;
			}
		}
		return false;
	}

	$.S.attr = function (key, value) {
	    if(key) {
            if ($.isset(key, ' ') && value) {
                var kd = {};
                $.each($.explode(' ', key, ''), function (_, v) {
                    kd[v] = value;
                });
                key = kd;
                kd = null;
                value = null;
            }
            var isvalue = $.isset(value);
            var values = [];
            this.map(function (ele) {
                if (value === '') {
                    ele.removeAttribute(key, value);
                }else if(!isvalue){
                    values.push(ele.getAttribute(key));
                } else if (!value && $.isObject(key)) {
                    $.each(key, function (k, v) {
                        ele.setAttribute(k, v);
                    });
                } else {
                    ele.setAttribute(key, value);
                }
                return ele;
            });
            if(!isvalue){
                if(values.length == 1){
                    values = values[0];
                }
                return values;
            }
        }
	    return this;
	}

    $.S.removeAttr = function (key) {
	    if(key) {
            key = $.explode(' ', key, '');
            this.map(function (ele) {
                if ($.isArray(key)) {
                    $.each(key, function (_, v) {
                        ele.removeAttribute(v);
                    });
                } else {
                    ele.removeAttribute(key);
                }
                return ele;
            });
        }
        return this;
    }

    $.S.data = function(key, value){
	    var keyisobj = $.isObject(key), isvalue = $.isset(value), isdel = key && value ==='';
	    if(!isvalue) {
            this.removeAttr(key);
        }
	    if(keyisobj){
	        var newkey = {};
	        $.each(key, function(k, v){
	            newkey['data-'+k] = v;
            })
            key = newkey;
	        newkey = null;
        }else{
            key = $.explode(' ', key, '');
            $.each(key, function(k, v){
                key[k] = 'data-'+v;
            });
        }
	    //是否只有一个key
	    var iskeyone = $.countArray(key) == 1 ? true : false;

	    var dt = {};
        this.map(function (ele) {
            if(keyisobj){
                $.each(key, function(k, v){
                    ele[k] = v;
                });
            }else if($.isArray(key)){
                $.each(key, function(_, k){
                    if(isdel){
                        delete ele[k];
                    }else if(isvalue){
                        ele[k] = value;
                    }else{
                        var val = ele[k];
                        if($.isset(val)){
                            dt[k.substr(5)] = val;
                        }
                    }
                });
            }else{
                if(isdel){
                    delete ele[key];
                }else if(isvalue){
                    ele[key] = value;
                }else{
                    var val = ele[key];
                    if($.isset(val)){
                        dt[key.substr(5)] = val;
                    }
                }
            }
            return ele;
        });

        //读取模式返回数值
        if(!isvalue && !keyisobj){
            if(iskeyone){
                for(k in dt){
                    return dt[k];
                }
            }
            return dt;
        }
	    return this;
    }

	/**
	 * 清空节点
	 */
	$.S.empty = function(){
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
	$.S.val = function(value){
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
	$.S.text = function(value){
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
	 * @returns {string|$.S}
	 */
	$.S.nodeValue = function(value){

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
	$.S.html = function(value){
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
	$.S.remove = function(){
		this.map(function(ele){
			ele.parentNode.removeChild(ele);
		});
		return this;
	}

	/**
	 * 在节点之后添加
	 * @param {html|Node} html
	 * @returns {this}
	 */
	$.S.after = function (html) {
		return tempDom.call(this, html, function(ele, node){
			ele.parentNode.insertBefore(node, ele.nextSibling);
		}, true);
	}

	/**
	 * 在节点之前添加
	 * @param {html|Node} html
	 * @returns {this}
	 */
	$.S.before = function (html) {
		return tempDom.call(this, html, function(ele, node){
			ele.parentNode.insertBefore(node, ele);
		});
	}

	/**
	 * 在节点内部最后添加
	 * @param {html|Node} html
	 * @returns {this}
	 */
	$.S.append = function (html, callback) {
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
	$.S.prepend = function (html, callback) {
		return tempDom.call(this, html, function(ele, node){
			ele.insertBefore(node, ele.firstChild);
		}, true);
	}

// ====================== 遍历 ====================== //

	/**
	 * 循环遍历
	 * @param obj
	 * @param callback
	 * @returns {*}
	 */
	$.S.each = function(obj, callback) {
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
    $.S.map = function(elements, callback){
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
	 * @param start 起始
	 * @param end 结束
	 * @returns {*[]}
	 */
	$.S.slice = function(start, end){
		return [].slice.apply(this, [start, end]);
	}

	/**
	 * 取匹配集合 顺序为n的节点
	 * @param n
	 * @returns {*}
	 */
	$.S.eq = function(n){
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
	$.S.first = function(){
		return $(this[0]);
	}

	/**
	 * 取匹配集合最后一个
	 * @returns {any}
	 */
	$.S.last = function(){
		var n = this.length > 1  ? this.length -1 : 0	;
		return $(this[n]);
	}

	/**
	 * 检查集合中是否存在选择器范围
	 * @param selector
	 * @returns {boolean} 返回 false | true
	 */
	$.S.is = function(selector){
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
    $.S.find = function(selector){
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
	$.S.children = function(selector){
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
    $.S.childAll = function(){
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
    $.S.siblings = function(selector){
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
    $.S.parent = function(selector){
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
    $.S.parents = function(selector){
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
	$.S.prev = function(selector){
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
	$.S.prevAll = function(selector){
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
    $.S.next = function(selector){
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
	$.S.nextAll = function(selector){
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
	$.S.on = function (event, selector, callback) {
		var self = this;
		if($.isFunction(selector) && !callback){
			callback = selector;
			selector = null;
		}
		callback = callback ? callback : function(){return false};

		return self.each(function (_, ele) {
			var kid = KID(ele);
			bindEventData[kid] = bindEventData[kid] || {};

			event.split(/\s/).forEach(function (evn) {
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
	$.S.off = function(event, callback) {
		var self = this, isCall = callback ? 1 : 0;
		callback = callback ? callback : function(){return false};
		return self.each(function (_, ele) {
			var kid = KID(ele);
			event.split(/\s/).forEach(function (evn) {
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
    $.S.hover = function(a, b){
        return this.mouseenter(a).mouseleave(b || a);
    }
// ====================== 当前或指定url格式化为对象 ====================== //
    $.S.urls = function(url){
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
	$.S.urlsAdd = function(url, query){
    	return url + (url.indexOf('?') !== -1 ? '&' : '?') + query;
	}

	/**
	 * 将一个对象格式化为url参数，并做urlencode
	 * @param url
	 * @returns {*}
	 */
	$.S.urlsParam = function(url){
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
    $.S.ajax = function(option){
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
	$.S.monitor = function(){
    	this.map(function(ele){
			var value = ele.value;
			Object.defineProperty(ele, 'value', {
				enumerable: true,
				configurable: true,
				set : function(v){
					value = v;
					debug(value);
				},
				get : function(v){

					return value;
				}
			});
		});
	}


// ====================== 元素监听 ====================== //
	$.S.tpl = function(_DATA){
    	var self = this;

		//匹配变量正则 {xxx}
		var variableReg = /\$\{((?:.|\r?\n)+?)\}/g;

    	//变量监听对象
		var _TPLdefPCallFun = {
			ADDC : {}, //添加值时待监听链表
			SETC : {}, //写值时待监听链表 key=需要拦截的变量名 value=变更回调
			DELC : {}, //删除时待监听链表
			GETC : {}, //获取时待监听链表,
			GUPDC : {}, //更新时待监听链表
			globalUpdateUUID : 0,
			add : function(key, fun){
				this.ADDC[key] = this.ADDC[key] || [];
				this.ADDC[key].push(fun);
			},
			set : function(key, fun){
				this.SETC[key] = this.SETC[key] || [];
				this.SETC[key].push(fun);
			},
			get : function(key, fun){
				this.GETC[key] = this.GETC[key] || [];
				this.GETC[key].push(fun);
			},
			delete : function(key, fun){
				this.DELC[key] = this.DELC[key] || [];
				this.DELC[key].push(fun);
			},
			globalUpdate : function(setObj, fun){
				var i = this.globalUpdateUUID ++;
				this.GUPDC[i] = function(){
					return fun.call(setObj, arguments);
				}
				return i;
			},
			clear : function(key){
				delete this.GUPDC[key];
				return this;
			}
		};


		/**
		 * 字符串转为实际变量
		 * @param variable 变量字符串
		 * @param isReturnStr 是否只需要返回解析后的变量字符串
		 * @returns {*}
		 */
		function strTovars(variable, isReturnStr){

			var vars, returnStr = variable;
			if(!variable){
				returnStr = '_DATA';
				vars = _DATA;
			}else {
				//先从局部变量中匹配
				try {
					returnStr = '_DATA.' + variable;
					vars = eval(returnStr);
				} catch (e) {
					try {
						vars = eval(variable);

					} catch (e) {
					}
				}
			}
			console.assert(vars !== 'undefined', variable+'变量不存在');
			return isReturnStr ? returnStr : vars;
		}

    	var Tpc = {
    	    el : null, //前台渲染区dom对象
            dom : $('<div></div>'), //准备渲染到前台的节点
            tmpDom : $('<div></div>'), //临时节点
			init : function(el){
				this.el = el; //el变量传递
				this.format().treeInit();
				return this;
			},

			//模板语法格式化为符合内部要求的语法
			format : function(){
				var code = this.el.innerHTML;
				code = code.replace(/\{(if|loop) ([^\\]+?)\}/ig, '<ksascope><ksa $1><ksafactor>$2</ksafactor>');
				code = code.replace(/\{(elseif) ([^\\]+?)\}/ig, '</ksa><ksa $1><ksafactor>$2</ksafactor>');
				code = code.replace(/\{else\}/ig, '</ksa><ksa else>');

				code = code.replace(/\{eval\}/ig, '<ksa eval>');
				code = code.replace(/\{\/eval\}/ig, '</ksa>');
				code = code.replace(/\{eval ([\s\S]*?)\}/ig, '<ksa eval>$1</ksa>');
				code = code.replace(/\{\/(if|loop)\}/ig, '</ksa></ksascope>');
				this.code = code;
				return this;
			},

			//创建虚拟节点
            treeInit : function(){
    	        var $this = this;
				this.tmpDom.html(this.code);
                //遍历虚拟节点
                this.tmpDom.childAll().map(function(ele){

					ele = $(ele);


					$this.renderElement(ele);

					if(ele[0].tagName =='KSA'){
						if(ele.isAttr('loop')){
							ele.childAll().each(function(i, el){
								$this.dom.append(el);
							});
						}
					}else{
						$this.dom.append(ele);
					}

                });

				//清空前台dom 并重新填充
				var rec = $(this.el).empty();
                $this.dom.childAll().map(function(el){
                    rec.append(el);
                });
				return this;
			},
            //遍历虚拟节点 填充到前台并侦听数据变化
			renderElement : function(ele, dt){
				ele = $(ele);
                var $this = this,
					tps = ele[0].nodeType;

                if(tps ===1){

					//if节点整理
					$this.loopList(ele);

					//ele[0].tagName =='KSA' && debug(ele);

					ele.childAll().each(function(_, el){
						$this.renderElement(el, dt);
					});

                }else if(tps ===3){
					//$this.analyze(ele, dt);
				}
                return ele[0];
            },
			loopList : function(ele, tpl){
    	    	ele = $(ele);
				if(ele[0].nodeType == 1 && ele.isAttr('loop')) {
					var $this = this;
					var loop = $.explode(' ', ele.children('ksafactor').html(), '');
					ele.children('ksafactor').remove();

					tpl = tpl ? tpl : ele.html().replace("'", "\'");

					var dtStr = loop[0],
						Kk = loop[2] ? loop[1] : 'key',
						Vv = loop[2] ? loop[2] : loop[1];


					dt = strTovars(dtStr);
					/*
                                    //loop变量变化检测
                                    !ele[0]._KSAnodeValue && _TPLdefPCallFun.set(dtStr, function(){
                                        ele.html('');
                                        $this.loopList(ele, tpl);
                                    });
                    */
					ele.empty();


					/**
					 * 根据数据创建一个loop子节点
					 * @param k 键名
					 * @param v 值
					 * @returns {*|ChildNode}
					 * @private
					 */
					function _newloopNode(k, v){
						var rek = dtStr + ($.isNumber(k) ? ('[' + k + ']') : ('.' + k));
						var code = tpl.replace(new RegExp('\\${' + Vv, 'g'), '${' + rek);
						code = code.replace(new RegExp('\\${' + Kk + '}'), k);
						return $.dom('<ksaloopline>'+code+'</ksaloopline>')[0];
					}

					//根据数据组合dom
					var DomChins = {};
					$.each(dt, function (k, v) {
						DomChins[k] = _newloopNode(k,v);
					});


					function _loopNodeRender(k, el){
						var dk = ($.isNumber(k) ? ('[' + k + ']') : ('.' + k)); //当前loop子键名
						var rek = dtStr + dk; //当前loop数据主键名
						var lineCode = ('var ' + Vv + ' = ' + strTovars(dtStr, true) + dk+';');

						$this.analyze(el);
						$this.renderIF(el, lineCode);

						var insertDom = [];
						el.childNodes.forEach(function(e){
							insertDom.push(e);
						});



						//当前loop变量被删除监控
						_TPLdefPCallFun.delete(rek, function(){
							insertDom.forEach(function(e){
								$(e).remove();
							})
						});
						DomChins[k] = insertDom;
						return insertDom;
					}

					$.each(DomChins, function(k, el){
						ele.append(_loopNodeRender(k, el));
					});

					//主变量写入检测
					_TPLdefPCallFun.add(dtStr, function(){
						//遍历所有list数据找出差异并加入到dom中
						var fastK;
						$.each(dt, function(k, val){
							//找到差异项 并在前一个loop循环最后插入新节点
							if(!DomChins[k]){
								var dms = _loopNodeRender(k, _newloopNode(k, val));
								var indexDom = DomChins[fastK].pop();
								$(indexDom).after(dms);
							}
							fastK = k;
						});
					});

					/*
					$.each(dt, function (k, v) {
						var rek = dtStr + ($.isNumber(k) ? ('[' + k + ']') : ('.' + k));
						var code = tpl.replace(new RegExp('\\${' + Vv, 'g'), '${' + rek);
						code = code.replace(new RegExp('\\${' + Kk + '}'), k);
						//组合局部变量给解析函数解析为实际值
						var tmpdom = $.dom('<ksaloopline>'+code+'</ksaloopline>');

						$this.analyze(tmpdom[0]);

						$this.renderIF(tmpdom[0], ('var ' + Vv + ' = ' + strTovars(dtStr, true) + '[' + k + '];'));

						var insertDom = [];
						tmpdom[0].childNodes.forEach(function(e){
							insertDom.push(e);
						});
						ele.append(insertDom);

						//当前loop变量被删除监控
						_TPLdefPCallFun.delete(rek, function(){
							insertDom.forEach(function(e){
								$(e).remove();
							})
						});
					});
					*/
				}
				return this;
			},
			renderIF : function(element, evalCode){
    	    	var $this = this;
				var R = {
					//把初始化的节点全部转为占位节点
					def2comment : function(doms){
						var ths = this;
						$(doms).each(function(_, ele){
							var eles = $(ele);
							if(ele.nodeType == 1 && eles.isAttr('if elseif else')){

								var childIF = eles.children('ksafactor');
								var comnode = $.dom('<!---->')[0];
								comnode._KSAIF = {
									mark : eles.isAttr('if') ? 'if' : (eles.isAttr('elseif') ? 'elseif' : 'else' ), //判断类型
									ifcode : childIF.html(), //条件判断源码
									return : false, //条件解析结果
									eval : '(function(e){ '+evalCode+' e._KSAIF.return = eval(e._KSAIF.ifcode);})', //封装解析语法到属性中
									childs : [], //子节点
									isPush : false, //子节点是否已经添加到dom中
									scope : [] //当前域下所有节点 包含自己
								};
								childIF.remove();
								ele.childNodes.forEach(function(e){
									comnode._KSAIF.childs.push(e);
								})

								eles.after(comnode).remove();

							}else if(ele.nodeType == 1){
								ele.childNodes.forEach(function(e){
									ths.def2comment(e);
								})
							}
						});
						return this;
					},
					//上下级关系绑定 此环节ksascope标签还存在
					sliblings : function(doms){
						var ths = this;
						$(doms).each(function(_, ele){
							if(ele._KSAIF){
								//所有作用域中的if节点 包含自己
								ele.parentNode.childNodes.forEach(function(e){
									ele._KSAIF.scope.push(e);
								});
							}else if(ele.nodeType == 1){
								ele.childNodes.forEach(function(e){
									ths.sliblings(e);
								})
							}
						});
						return this;
					},
					//移除作用域标签
					removeScope : function(doms){
						var ths = this;
						$(doms).each(function(_, ele){
							if(ele.tagName ==='KSASCOPE'){
								$(ele).after(ele.childNodes).remove();
							}else if(ele.nodeType == 1){
								ele.childNodes.forEach(function(e){
									ths.removeScope(e);
								})
							}
						});
						return this;
					},
					render : function(doms){
						var ths = this;
						$(doms).each(function(_, ele){
							var eles = $(ele);

							if(ele._KSAIF && ele.nodeType ===8){

								//解析if语句结果
								ele._KSAIF.eval && eval(ele._KSAIF.eval).call(ele, ele);

								var scopeIsTrue = false; //当前域下是否有结果
								//如果当前if结果为真 通知域下所有节点当前结果
								ele._KSAIF.scope.forEach(function(e){
									//不处理自己节点
									if(ele === e){
										return;
									}
									//如果当前节点不是else 并且判断结果为true 则同域下所有节点为false
									if(ele._KSAIF.return === true){
										e._KSAIF.return = false;
									}
									if(e._KSAIF.return === true){
										scopeIsTrue = true;
									}
								});

								//如果当前节点是else 并且同域下没有true 则默认为true
								if(ele._KSAIF.mark ==='else' && scopeIsTrue === false){
									ele._KSAIF.return = true;
								}

								//如果条件为真 并且节点存在于dom中
								if(ele._KSAIF.return === true){
									if(!ele._KSAIF.isPush) {
										//用子节点替换当前
										eles.after(ele._KSAIF.childs).remove();
										ele._KSAIF.isPush = true; //属性标注为已push到DOM
										if (ele._KSAIF.mark !== 'else') {
											//全局检测 如果任意变量发生变化，则重新解析当前域
											_TPLdefPCallFun.globalUpdate(ele, function () {
												if (this._KSAIF.mark === 'else') {
													return;
												}
												var ts = this, childlength = ts._KSAIF.childs.length;
												ts._KSAIF.eval && eval(ts._KSAIF.eval).call(ts, ts);
												//如果编译结果非真 则删除所有节点
												if (ts._KSAIF.return === false) {
													ts._KSAIF.childs.forEach(function (e, i) {
														if (!$.inArray(document.compareDocumentPosition(e), [35, 37])) {
															//在最后一个加入占位节点 并且标注为未push到DOM
															if (i == childlength - 1) {
																$(e).after(ts);
																ts._KSAIF.isPush = false;
															}
															e.remove();
														}
													});
													ths.render(ts._KSAIF.scope);
												}
												return true;
											});
										}
									}
								}
							//如果是元素节点则一直渲染子节点
							}else if(ele.nodeType == 1){
								ele.childNodes.forEach(function(e){
									ths.render(e);
								})
							}
						});

						return this;
					}
				};

				R.def2comment(element).sliblings(element).removeScope(element).render(element);

			},
            //解析模板
            analyze : function(element, isDefPcall){
    	    	var $this = this;

				//此处只解析文本节点中的变量
				$(element).each(function(_, ele){
					var eles = $(ele);
    	    		var nodeType = ele.nodeType;

					//递归解析子级
					if(nodeType === 1) {
						eles.childAll().each(function (_i, childel) {
							$this.analyze(childel);
						});

					//文本节点解析
					}else if(nodeType === 3){

						var tcode = ele._KSATPL || ele.nodeValue;
						//节点增加_KSATPL属性 用于数据变更时的二次渲染
						if(tcode && variableReg.test(tcode)){
							ele._KSATPL = tcode;
						}

						var varsChain = {};
						//字符串变量转换为实际变量值
						tcode = tcode.replace(variableReg, function (_vs) {
							var _vsK = _vs.trim().replace(/^\${/g, '').replace(/}$/g, '');
							varsChain[_vsK] = _vsK;

							_vs = strTovars(_vsK);
							return _vs === undefined ? '' : _vs;
						});
						eles.nodeValue(tcode);

						//如果不是监听事件回调的渲染 则添加监听事件
						if(!isDefPcall){
							//debug(varsChain);
							//当前节点所有使用到的变量 添加侦听事件，如果变量有更新 则同时更新dom
							$.each(varsChain, function(keys){
								_TPLdefPCallFun.set(keys, function(val){
									//debug('写值回调：'+val+' / 重新解析节点');
									$this.analyze(ele, true);
								});
							});
						}
					}




/*
					//if判断节点的处理
					if($.isset(ele._KSAIF)){
						//$.inArray(document.compareDocumentPosition(ele),[35,37])


						if(ele._KSAIF) {
							eval('(function(e){ '+evalCode+'  e._KSAIFReturn = eval(e._KSAIF);})').call(ele, ele);
							//如果条件为真则设定后续紧邻判断节点的结果属性
							if (ele._KSAIFReturn) {
								eles.next('[elseif], [else]').each(function(_, el){
									el._KSAIFReturn = false;
								});
							}
						}


    	    			var currEle,
							AddNodeChain; //if子节点链
						//if占位节点 转 真实
						if(ele._KSAIFReturn) {

							if(nodeType == 8){
								currEle = $.dom(ele._KSATPL)[0];
								currEle._KSAIF = ele._KSAIF;
								currEle._KSAIFReturn = ele._KSAIFReturn;
								currEle._KSATPL = ele._KSATPL;

								AddNodeChain = $(currEle).childAll();

								$this.analyze(currEle, evalCode, isDefPcall);
								eles.after($(currEle).childAll());
								eles.remove();


								//在全局监测链中写入更新操作
								_TPLdefPCallFun.globalUpdate({dom:currEle, element:ele, childNodes:AddNodeChain}, function () {
									var ths = this;
										if(this.childNodes) {
											$.map(this.childNodes, function (e, i) {
												//在最后一个加入占位节点
												if (i == ths.childNodes.length - 1) {
													debug('add')
													$(e).after(ths.dom);
												}
												$(e).remove();
											});
										}
									$this.analyze(ths.dom, evalCode, true);
								});

							}

						//if真实节点转占位
						}else if(!ele._KSAIFReturn){

							if(nodeType == 1){
								currEle = $.dom('<!---->')[0];
								currEle._KSAIF = ele._KSAIF;
								currEle._KSAIFReturn = ele._KSAIFReturn;
								currEle._KSATPL = ele._KSATPL;
								eles.after(currEle).remove();

								//在全局监测链中写入更新操作
								_TPLdefPCallFun.globalUpdate(currEle, function () {
									$this.analyze(this, evalCode, true);
								});
							}

						}

    	    		}
*/
    	    		return ele;
				});


            },
		};


		//初始化模板语法
    	this.map(function(ele){
    		Tpc.init(ele);
		});


    	//对象变量名分割为数据 xxx.name / xxx[1].name / xxx.list[1]

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
			vars = vars.toString();
			var lk  = vars.indexOf('[');
			var ld = vars.indexOf('.');
			var fk = vars.lastIndexOf('[');
			var fd = vars.lastIndexOf('.');
			var lastOF = Math.max(fd, fk);

			var ancestor = vars; firstName = vars, lastName = '';

			//提取最后一个键名
			if(lastOF !== -1){
				ancestor = vars.substr(0, (lk >0 && ld >0 ? Math.min(lk,ld) : Math.max(lk,ld)));
				firstName = vars.substr(0, lastOF);
				//如果最后是[] 则取括号中间的字符 否则取.之后的字符
				lastName = fk > fd ? vars.substring(lastOF+1, vars.lastIndexOf(']')) : vars.substr(lastOF+1);
			}
			return [ancestor, firstName, lastName];
		}

    	//拦截变量 Object.defineProperty
		$.each(_TPLdefPCallFun.SETC, function(vars, callfun){
			vars = vars.toString();
			var fk = vars.lastIndexOf('[');
			var lastOF = Math.max(vars.lastIndexOf('.'), fk);

			var parent = '', subVars = vars;
			if(lastOF !== -1){
				parent = vars.substr(0, lastOF);
				subVars = fk == lastOF ? vars.substring(lastOF+1, vars.lastIndexOf(']')) : vars.substr(lastOF+1);
			}

			//debug('监听：'+parent +'='+ subVars);
			var parentObj = strTovars(parent)  ;
			var value = parentObj[subVars];
			Object.defineProperty(parentObj, subVars, {
				enumerable: true,
				configurable: true,
				set : function(v){
					if(v === value){//值相同时不回调函数
						return;
					}
					//回调处理做延迟 以达到值写入成功后再回调
					window.setTimeout(function(){
						$.each(_TPLdefPCallFun.GUPDC, function(_, fun){
							if(fun(v, value, parent, subVars) !== true){
								delete _TPLdefPCallFun.GUPDC[_];
								//debug('删除当前监听回调')
							}
						});

						callfun.forEach(function(cfval){
							cfval(v, value, parent, subVars);
						});
					},0);


					debug('defineProperty SET：'+v);

					value = v;
				},
				get : function(v){

					return value;
				}
			});
		});

		return {
			add : function(key, value){
				var kys = variableNameEx(key);
				var vars = strTovars(key, 1);
				eval('(function(v){'+vars+' = v;})').call(null,value);
				if(_TPLdefPCallFun.ADDC){
					$.each(_TPLdefPCallFun.ADDC, function(_k, callfun){
						if(_k == kys[1]){
							callfun.forEach(function(cfval){
								cfval();
							});
						}
					});
				}
			},
			delete : function(key){
				var $this = this;
				var vars = strTovars(key);
				var delname = '_DATA'+($.isNumber(key) ? '['+key+']' : '.'+key);

				if($.isObject(vars)){
					$.each(vars, function(k, _){
						k = key + ($.isNumber(k) ? '['+k+']' : '.'+k);
						$this.delete(k);
					});
				}
				if(_TPLdefPCallFun.SETC){
					$.each(_TPLdefPCallFun.SETC, function(_k, callfun){
						if(_k == key){
							callfun.forEach(function(cfval){
								cfval('');
							});
						}
					});
				}

				if(_TPLdefPCallFun.DELC[key]){
					debug('删除：'+key);
					$.each(_TPLdefPCallFun.DELC[key], function(_, callfun){
						callfun();
					});
				}
				eval('('+delname+' = "")');

			}
		};
	}

// ====================== 判断与重写函数类 ====================== //
	$.S.isWindow = function isWindow(obj) {
		return obj != null && obj === obj.window;
	};

    $.S.isDocument = function(obj){
        return obj != null && obj.nodeType == obj.DOCUMENT_NODE;
    }

	$.S.isArray = function(){
		return v && v.constructor == Array;
	}

	/**
	 * 模拟php isset
	 * @param key
	 * @param str 指定需要检测的字符串 可选
	 * @returns {boolean}
	 */
	$.S.isset = function(key, str){
        if(str !== undefined){
            return key.indexOf(str) === -1;
        }else{
            return typeof(key) !== 'undefined';
        }
	}
	$.S.isTrue = function(v) {
		return v === true;
	}
	$.S.isFalse = function(v) {
		return v === false;
	}
	$.S.isArray = function(v){
		return v && v.constructor == Array;
	}
    $.S.isArrayLike = function(obj) {

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
	$.S.isNumber = function(v){
		return v && /^[0-9]+$/.test(v.toString());
	}

	$.S.isBool = function(v){
		return typeof(v) === 'boolean';
	}

	$.S.isObject = function(v){
		return v && typeof(v) === 'object';
	}

	$.S.isObjectPlain = function(v) {
		return $.isObject(v) && !$.isWindow(v) && Object.getPrototypeOf(v) === Object.prototype;
	}

	$.S.isString = function(v){
		return typeof(v) === 'string';
	}
	$.S.isFunction = function(v){
		return v && typeof(v) === 'function';
	}

	$.S.isWindow = function(v) {
		return v != null && v === v.window;
	}

	$.S.isEmpty = function(v=[]){
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
	$.S.isDomAll = function(dom){
		return dom instanceof HTMLElement || dom instanceof Node || dom instanceof XMLDocument || dom instanceof  NodeList
	}

	$.S.isNull = function(v){
		return v === null;
	}
	$.S.inArray = function(val,dt, rkey){
		var S = false;
		$.each(dt,function(k,v){
			if(val == v){
				S = rkey ? k : true;
			}
		});
		return S;
	}
	$.S.countArray = function(dt){
		var S = 0;
		$.each(dt,function(){
			S ++;
		});
		return S;
	}
	$.S.arrayMerge = function(){
		var arr = arguments[0];
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
	$.S.explode = function(ft, str, notemp){
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
	$.S.implode = function(n, arr){
		var s = '', str = '';
		for(k in arr){
			str += s+arr[k];
			s = n;
		}
		return str;
	}
	$.S.unset = function(dt,keys){
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

    $.S.trim = function(str, char){
        str = str.toString();
        if(!char){
            str = str.replace(new RegExp('^\\'+char+'+', 'g'),'');
            str = str.replace(new RegExp('\\'+char+'+$', 'g'),'')
        }else{
            str = str.trim();
        }
        return str;
    }

	$.each(('blur focus focusin focusout resize scroll click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup contextmenu').split(' '),function (i, name) {
		$.S[name] = function(func, fn) {
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