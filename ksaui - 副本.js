/**
 * KSA核心JS
 */
(function(document, undefined) {

	function debug(data){
		if(typeof data ==='object'){
			console.dir(data);//debug
		}else{
			console.log('%cKSAUI-Debug','background:#00c; color:#fff',data);//debug
		}
	}

	function array2object(arr){
		var obj = {};
		for(var k in arr){
			obj[k] = arr[k];
		}
		return obj;
	}

	/**
	 * 创建临时dom并回调
	 * @param {html|Node} code html或节点
	 * @param {function} callback 回调函数
	 * @param {boolean} reOrder 是否倒序回调
	 * @returns {tempDom}
	 */
	function tempDom(code, callback, reOrder){
		//创建一个虚拟dom
		var dom = document.createRange().createContextualFragment(code);
		//拿到虚拟dom中生成的节点
		var news = dom.childNodes;
		//将传入的html或dom对象添加到虚拟dom中
		K.map(this, function (ele) {
			var n = !reOrder ? news.length : 0;
			var i = reOrder ? news.length -1 : 0;
			while (reOrder ? i >=0 : i < n){
				var node = news[i];
				callback.call(ele, ele, node.cloneNode(true));
				reOrder ? i -- : i++;
			}
		});
		return this;
	}

	var K = function(selector){
		return new K.S.A(selector);
	}

	K.S = K.__proto__ = {
		version : '1.0'
	};

	var _A = K.S.A = function(selector){
		if(selector) {
			if (selector instanceof K) {
				return selector;
			} else if (selector instanceof HTMLElement) {

				selector = [selector];
			} else if (selector instanceof XMLDocument) {
				selector = [selector];
			}else if(K.isString(selector) && (selector = selector.trim()) && selector.indexOf('<') ==0 && selector.lastIndexOf('>') == selector.length-1){
				selector = document.createRange().createContextualFragment(selector);
				selector = selector.childNodes;

			} else {
				selector = [].slice.call(document.querySelectorAll(selector));
			}

			var length = selector.length;

			var obj = {};
			for(var k in selector){
				if(selector[k] instanceof HTMLElement) {
					obj[k] = arr[k];
				}
			}
			selector = obj;
			selector.length = length;
		}else{
			selector = {length:0};
		}
		var self = this;
		self = K.arrayMerge(self, selector);
		return self;
	}

	_A.prototype = K.S;

    K.S.ready = function(callback) {
        if (/complete|loaded|interactive/.test(document.readyState)) {
            callback($);
        } else {
            document.addEventListener('DOMContentLoaded', function() {
                callback($);
            }, false);
        }
        return this;
    }

// ====================== 文档操作 ====================== //

	/**
	 * 添加class
	 * 最后更新 : 2020年6月19日 20:01:50
	 * @param name 需要添加的class值，多个以空格分割
	 * @returns {$}
	 */
	K.S.addClass = function(name){
		name = K.explode(' ', name, '');
		if(name){
			this.map(function(ele){
				var classList = K.explode(' ', ele.getAttribute('class'),' ');
				var addname = K.map(name, function (v) {
					return !K.inArray(v, classList) ? v : null;
				});
				addname = K.implode(' ',addname);
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
	K.S.removeClass = function(name){
		name = K.explode(' ', name, '');
		if(name){
			K.map(this,function(ele){
				var classList = K.explode(' ', ele.getAttribute('class'),' ');
				classList = K.map(classList, function (v) {
					return !K.inArray(v, name) ? v : null;
				});
				classList = K.implode(' ',classList);
				classList ? ele.setAttribute('class', classList) : ele.removeAttribute('class');
			});
		}
		return this;
	}

	K.S.attr = function (key, value) {
	    if(key) {
            if (K.isset(key, ' ') && value) {
                var kd = {};
                K.each(K.explode(' ', key, ''), function (_, v) {
                    kd[v] = value;
                });
                key = kd;
                kd = null;
                value = null;
            }
            var isvalue = K.isset(value);
            var values = [];
            this.map(function (ele) {
                if (value === '') {
                    ele.removeAttribute(key, value);
                }else if(!isvalue){
                    values.push(ele.getAttribute(key));
                } else if (!value && K.isObject(key)) {
                    K.each(key, function (k, v) {
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

    K.S.removeAttr = function (key) {
	    if(key) {
            key = K.explode(' ', key, '');
            this.map(function (ele) {
                if (K.isArray(key)) {
                    K.each(key, function (_, v) {
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

    K.S.data = function(key, value){
	    var keyisobj = K.isObject(key), isvalue = K.isset(value), isdel = key && value ==='';
	    if(!isvalue) {
            this.removeAttr(key);
        }
	    if(keyisobj){
	        var newkey = {};
	        K.each(key, function(k, v){
	            newkey['data-'+k] = v;
            })
            key = newkey;
	        newkey = null;
        }else{
            key = K.explode(' ', key, '');
            K.each(key, function(k, v){
                key[k] = 'data-'+v;
            });
        }
	    //是否只有一个key
	    var iskeyone = K.countArray(key) == 1 ? true : false;

	    var dt = {};
        this.map(function (ele) {
            if(keyisobj){
                K.each(key, function(k, v){
                    ele[k] = v;
                });
            }else if(K.isArray(key)){
                K.each(key, function(_, k){
                    if(isdel){
                        delete ele[k];
                    }else if(isvalue){
                        ele[k] = value;
                    }else{
                        var val = ele[k];
                        if(K.isset(val)){
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
                    if(K.isset(val)){
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
	K.S.empty = function(){
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
	K.S.val = function(value){
		if(K.isset(value)){
			this.map(function(ele){
				if (ele.nodeType === 1) {
					var tg = ele.tagName;
					switch (tg) {
						case 'INPUT':
							ele.value = value; break;
						case 'SELECT':
							K.each(ele.options, function(_, el){
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
	K.S.text = function(value){
		if(K.isset(value)){
			this.map(function(ele){
				if (ele.nodeType === 1 || ele.nodeType === 11 || ele.nodeType === 9) {
					ele.textContent = value;
				}
			});
			return this;
		}else {
			var t = [];
			K.each(this, function (k, value) {
				t[k] = value.innerText;
			});
			return t.join("\n");
		}
	};

	/**
	 * 写入或读取HTML源码
	 * @param {html|Node} value 传值表示写入
	 * @returns {string|$}
	 */
	K.S.html = function(value){
		if(K.isset(value)){
			this.map(function(ele){
				if(K.isObject(value)){
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
	K.S.remove = function(){
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
	K.S.after = function (html) {
		return tempDom.call(this, html, function(ele, node){
			ele.parentNode.insertBefore(node, ele.nextSibling);
		}, true);
	}

	/**
	 * 在节点之前添加
	 * @param {html|Node} html
	 * @returns {this}
	 */
	K.S.before = function (html) {
		return tempDom.call(this, html, function(ele, node){
			ele.parentNode.insertBefore(node, ele);
		});
	}

	/**
	 * 在节点内部最后添加
	 * @param {html|Node} html
	 * @returns {this}
	 */
	K.S.append = function (html) {
		return tempDom.call(this, html, function(ele, node){
			ele.appendChild(node);
		});
	}

	/**
	 * 在节点内部最前面添加
	 * @param {html|Node} html
	 * @returns {this}
	 */
	K.S.prepend = function (html) {
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
	K.S.each = function(obj, callback) {
		var k, i=0;
		if (K.isArray(obj) || K.isObject(obj)) {
			for (k in obj) {
				callback(k, obj[k], i);
				i ++;
			}
		} else {
			callback = callback || (typeof(obj) =='function' ? obj : null);
			obj = K.isFunction(obj) ? this : obj;

			for (k in obj) {
				var value = obj[k];
				if(value instanceof HTMLElement) {
					callback(k, value, k);
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
    K.S.map = function(elements, callback){
    	if(!callback && K.isFunction(elements)){
			callback = elements;
			elements = this;
		}
        var value, values = [], i, key;

        if (K.isArrayLike(elements)) {
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
	K.S.slice = function(start, end){
		return [].slice.apply(this, [start, end]);
	}

	/**
	 * 取匹配集合 顺序为n的节点
	 * @param n
	 * @returns {*}
	 */
	K.S.eq = function(n){
		n += 0;
		return this.slice(n, n + 1);
	}

	/**
	 * 取匹配集合第一个
	 * @returns {any}
	 */
	K.S.first = function(){
		return $(this[0]);
	}

	/**
	 * 取匹配集合最后一个
	 * @returns {any}
	 */
	K.S.last = function(){
		var n = this.length > 1  ? this.length -1 : 0	;
		return $(this[n]);
	}

	/**
	 * 检查集合中是否存在选择器范围
	 * @param selector
	 * @returns {boolean} 返回 false | true
	 */
	K.S.is = function(selector){
		var s = false;
		K.map(this,function(ele){

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
		K.map(element,function(el){
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
    K.S.find = function(selector){
        selector = selector || '*';
        var rdom = K(), ri =0;
		this.map(function(ele){
			K.map(ele.querySelectorAll(selector), function(el){
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
	K.S.children = function(selector){
        selector = selector || '*';
	    var self = this, rdom = K(), ri =0;
	    this.map(this, function(ele){
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
     * 所有同辈
     * @param selector
     * @returns {*}
     */
    K.S.siblings = function(selector){
        selector = selector || '*';
        var rdom = K(), ri=0;
        this.map(this, function(ele){
            //同父级下所有直接子级（不包含自己）
            K.map(ele.parentNode.childNodes, function(el){
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
    K.S.parent = function(selector){
        selector = selector || '*';
		var rdom = K(), ri=0;
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
    K.S.parents = function(selector){
		var rdom = K(), ri=0;
		K.map(dir(this, 'parentNode', selector), function(el){
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
	K.S.prev = function(selector){
        selector = selector || '*';
		var rdom = K(), ri=0;
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
	K.S.prevAll = function(selector){
		var rdom = K(), ri=0;
		K.map(dir(this, 'previousElementSibling', selector), function(el){
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
    K.S.next = function(selector){
        selector = selector || '*';
		var rdom = K(), ri=0;
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
	K.S.nextAll = function(selector){
		var rdom = K(), ri=0;
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
	K.S.on = function (event, selector, callback) {
		var self = this;
		if(K.isFunction(selector) && !callback){
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
						if(!K.inArray(e.target, ele.querySelectorAll(selector))){
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
	K.S.off = function(event, callback) {
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
					K.isEmpty(bindEventData[kid][evn]) && delete bindEventData[kid][evn];
				}else{
					ele.removeEventListener(evn, callback, false);
					ele.removeEventListener(evn, callback, true);
				}
			})
			K.isset(bindEventData[kid]) && K.isEmpty(bindEventData[kid]) && delete bindEventData[kid];

		});
	};

    /**
     * hover事件
     * @param a
     * @param b
     * @returns {*}
     */
    K.S.hover = function(a, b){
        return this.mouseenter(a).mouseleave(b || a);
    }
// ====================== 当前或指定url格式化为对象 ====================== //
    K.S.urls = function(url){
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
			K.each(P.search.substr(1).split("&"),function(k,val){
				val = val.split('=');
				P.get[val['0']] = val['1'];
			});
		}
		if(P.pathname) {
			var pn = P.pathname;
			//去掉前后/
			pn = pn.replace(/^\/+/,'');
			pn = pn.replace(/\/+$/,'');
			K.each(pn.split("/"),function(k,val){
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
	K.S.urlsAdd = function(url, query){
    	return url + (url.indexOf('?') !== -1 ? '&' : '?') + query;
	}

	/**
	 * 将一个对象格式化为url参数，并做urlencode
	 * @param url
	 * @returns {*}
	 */
	K.S.urlsParam = function(url){
		if(K.isObject(url) || K.isArray(url)){
			var u = [];
			K.each(url, function(key, value){
				u.push(encodeURIComponent(key) + "=" + encodeURIComponent(value == null ? "" : value));
			});
			url = K.implode('&',u);
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
    K.S.ajax = function(option){
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
			var copyCallback = K.isFunction(jsonpCallback) ? ('jsonpCallback' + (jsonpID++)) : jsonpCallback;

			window[copyCallback] = function () {
				responseData = arguments;
			}
			option.url = K.urlsAdd(option.url,'jsonpCallback='+copyCallback);
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
					K.isFunction(option.error) && option.error.call(this, result);
				}else{
					K.isFunction(option.success) && option.success.call(this, result);
				}
			});
			document.head.appendChild(script);
			copyCallback = responseData = null;

		//其他ajax请求采用XMLHttp
		}else{

			if(getType =='POST'){
				_data = new FormData();
				K.each(option.data, function(k, val){
					_data.append(k, val);
				});
			}else if(getType =='GET'){
				_data = K.urlsParam(option.data);
				option.url = K.urlsAdd(option.url, _data);
				_data = '';
			}

			var A = new XMLHttpRequest();

			A.open(getType, option.url,true);

			K.each(headers, function(k, val){
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
					K.isFunction(option.success) && option.success.call(this, result);
				}else{
					K.isFunction(option.error) && option.error.call(this, result);
				}
			}
		}
    }
// ====================== 元素监听 ====================== //
	K.S.monitor = function(){
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
// ====================== 判断与重写函数类 ====================== //
	K.S.isWindow = function isWindow(obj) {
		return obj != null && obj === obj.window;
	};

    K.S.isDocument = function(obj){
        return obj != null && obj.nodeType == obj.DOCUMENT_NODE;
    }

	K.S.isArray = function(){
		return v && v.constructor == Array;
	}
	K.S.isset = function(key, str){
        if(str !== undefined){
            return key.indexOf(str) === -1 ? false : true;
        }else{
            return typeof(key) !== 'undefined';
        }
	}
	K.S.isTrue = function(v) {
		return v === true;
	}
	K.S.isFalse = function(v) {
		return v === false;
	}
	K.S.isArray = function(v){
		return v && v.constructor == Array;
	}
    K.S.isArrayLike = function(obj) {

        // Support: real iOS 8.2 only (not reproducible in simulator)
        // `in` check used to prevent JIT error (gh-2145)
        // hasOwn isn't used here due to false negatives
        // regarding Nodelist length in IE
		if (K.isFunction(obj) || K.isWindow(obj) || K.isString(obj)) {
			return false;
		}

        var length = !!obj && "length" in obj && obj.length, type = typeof(obj);

        return type === "array" || length === 0 ||
            typeof length === "number" && length > 0 && (length - 1) in obj;
    };
	K.S.isNumber = function(v){
		return v && in_array(typeof(v),['number','string']) && /^-?[0-9]+\.?[0-9]+$/.test(v.toString());
	}

	K.S.isBool = function(v){
		return typeof(v) === 'boolean';
	}

	K.S.isObject = function(v){
		return v && typeof(v) === 'object';
	}

	K.S.isObjectPlain = function(v) {
		return K.isObject(v) && !K.isWindow(v) && Object.getPrototypeOf(v) === Object.prototype;
	}

	K.S.isString = function(v){
		return typeof(v) === 'string';
	}
	K.S.isFunction = function(v){
		return v && typeof(v) === 'function';
	}

	K.S.isWindow = function(v) {
		return v != null && v === v.window;
	}

	K.S.isEmpty = function(v=[]){
		if(K.isObject(v) || K.isArray(v)){
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

	K.S.isNull = function(v){
		return v === null;
	}
	K.S.inArray = function(val,dt, rkey){
		var S = false;
		K.each(dt,function(k,v){
			if(val == v){
				S = rkey ? k : true;
			}
		});
		return S;
	}
	K.S.countArray = function(dt){
		var S = 0;
		K.each(dt,function(){
			S ++;
		});
		return S;
	}
	K.S.arrayMerge = function(){
		var arr = arguments[0];
		K.each(arguments, function(key, value){
			if(key > 0){
				K.each(value,function(k, val){
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
	K.S.explode = function(ft, str, notemp){
		str = ft && str ? str.toString().split(ft) : [];
		//如果需要排除空值
		if(K.isset(notemp)){
			var news = [], i =0;
			K.each(str, function(_, v){
				if(v != notemp){
					news[i] = v;
					i ++;
				}
			});
			str = news;
		}
		return str;
	}
	K.S.implode = function(n, arr){
		var s = '', str = '';
		for(k in arr){
			str += s+arr[k];
			s = n;
		}
		return str;
	}
	K.S.unset = function(dt,keys){
		keys = K.explode(' ', keys);
		var newDt = {};
		K.each(dt,function(k, v){
			if(!K.inArray(k,keys)){
				newDt[k] = v;
			}
		});
		if(K.isArray(dt)){
			newDt = Array.from(newDt);
		}
		return newDt;
	}

	K.each(('blur focus focusin focusout resize scroll click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup contextmenu').split(' '),function (i, name) {
		K.S[name] = function(func, fn) {
			return this.on(name, null, func, fn);
		};
	});
	
	window.KSA = window.$ = K;





	/**
	 * 兼容 AMD 模块
	 **/
	if (typeof define === 'function' && define.amd) {
		define('KSA', [], function() {
			return $;
		});
	}
	return K;
})(document);