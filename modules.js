/**
 * 요소의 특정 클래스를 토글
 * @param element {HTMLElement} 클래스를 변경할 요소
 * @param className {string} 클래스 이름
 * @returns {boolean} 토글 후 클래스 존재 여부
 */
export function toggleClass(element, className) {
    const including = [...element.classList].includes(className);
    if(including) {
        element.classList.remove(className);
    }else {
        element.classList.add(className);
    }
    return !including;
}

/**
 * 여러 input을 연결해 입력하도록 묶음
 * @param inputList 각 input은 maxlength 값 필요
 */
export function linkInputs(...inputList) {
    // 백스페이스 예외처리
    const exceptedKeys = [
        "Backspace",
        "Shift" // 모바일 키보드 입력시 자동으로 들어오는 input
    ];

    // maxlength 인식
    inputList = inputList.map(input => {
        const inputData = {
            element: input,
            maxlen: +input.getAttribute("maxlength")
        };

        // maxlength가 없거나, 1 미만인 경우 예외처리
        if(inputData.maxlen < 1) {
            throw new RangeError("Input elements must have maxlength attribute greater than 0.");
        }

        return inputData;
    });

    // 리스너 등록
    inputList.forEach(
        (input, index) => {
            input.element.addEventListener("keyup", event => {
                // 백스페이스 입력시 이벤트 스킵
                if(exceptedKeys.includes(event.key)) {
                    return false;
                }

                // 현재 값
                const currentValue = ("" + event.target.value);

                // 최대 길이 도달시 다음 input focus
                if(currentValue.length === input.maxlen) {
                    const nextItem = inputList[index + 1];
                    if(!nullish(nextItem)) {
                        nextItem.element.focus();
                    }
                }

                // 최대 길이 초과시 내용 자르기
                if(currentValue.length > input.maxlen) {
                    event.target.value = currentValue.substring(0, input.maxlen);
                }
            });
        }
    );

    // 공란에서 백스페이스 입력시 이전 입력란으로 이동하며 입력 이행
    inputList.forEach(
        (input, index) => {
            input.element.addEventListener("keydown", event => {
                const currentValue = ("" + event.target.value);
                if(event.key === "Backspace" && currentValue.length < 1 && index > 0) {
                    const prevItem = [...inputList][index - 1].element;
                    prevItem.focus();
                }
            });
        }
    );
}

/**
 * 키/메소드 체이닝 함수, optional chaining 대체용. 인자 순서대로 chain 진행
 * @param firstPort{any} 좌항. 무조건 optional
 * @param ports{{port: string, parameter: any[]|any, optional: undefined|boolean}|string} 추가 항. optional 가능
 * @returns {any|undefined} chaining 진행 결과. optional port가 nullish인 경우 undefined 반환
 */
export function chain(firstPort, ...ports) {
    // pointer : chaining 진행 변수
    let pointer = firstPort;
    // optional : 좌항의 nullish check 플래그
    let optional = true;

    // chaining 진행
    for(const port of ports) {
        // 좌항 optional 검사
        if(optional) {
            // nullish일 경우 undefined 반환
            if(nullish(pointer.port)) {
                return undefined;
            }
            // nullish가 아닐 경우 optional값 초기화
            optional = false;
        }

        // chain
        if(port.parameter) {
            // method
            if(!Array.isArray(port.parameter)) {
                port.parameter = [port.parameter];
            }
            pointer = pointer.port[port.port](...port.parameter);
        }else {
            // index
            pointer = pointer.port[(typeof port === "string") ? port : port.port];
        }

        // optional 여부 저장
        if(port.optional) {
            optional = true;
        }
    }

    // chaining 종료 후 pointer 반환
    return pointer;
}

/**
 * 초 형식의 숫자를 분:초(00:00) 형식으로 변경
 * @param number
 * @returns {string}
 */
export function numToMinSec(number) {
    const data = {
        min: Math.floor(Math.round(number) / 60),
        sec: Math.round(number) % 60
    };

    for(const key in data) {
        let item = data[key];
        item = `${data[key]}`.padStart(2, "0");
        if(item === "NaN") {
            item = "00";
        }
        data[key] = item;
    }

    return `${data.min}:${data.sec}`;
}

/**
 * 쿠키 컨트롤 인스턴스
 * @type {object}
 */
export const cookie = {
    /**
     * @param {string} name
     * @param {string} value
     * @param {object} options not required
     * @param {string} options.expires - type: string, form: number + unit, usable unit: [ms, s, m, h, d]
     * @param {string} options.path - type: string
     */
    set(name, value, options = {}) {
        let cookieString = `${name}=${value}`;
        if (options.expires) {
            const date = new Date();
            const timeUnit = {
                ms: 1,
                s: 1000,
                m: 1000 * 60,
                h: 1000 * 60 * 60,
                d: 1000 * 60 * 60 * 24,
            };
            const validTime = options.expires.match(/^(\d+)([a-z]{1,2})$/);
            date.setTime(
                date.getTime() + +validTime[1] * (timeUnit[validTime[2]] || 1)
            );
            cookieString += `;expires=${date.toUTCString()}`;
        }
        if (options.path) {
            cookieString += `;path=${options.path}`;
        }
        document.cookie = cookieString;
    },
    /**
     *
     * @param {string} name
     * @param {object} options
     * @param {boolean} options.onlyExists - type: boolean
     * @returns {null|string|boolean} - null: cannot find the cookie, string: cookie value, boolean: cookie does exist (or does not)
     */
    get(name, options = {}) {
        if (document.cookie) {
            const value = document.cookie.match("(^|;) ?" + name + "=([^;]*)(;|$)");
            let returnValue = null;
            if (value) {
                returnValue = value[2];
            }
            if (options.onlyExists) {
                returnValue = value ? true : false;
            }
            return returnValue;
        }
        return null;
    },
};

/**
 * 페이지 언어
 * @type {string}
 */
export let locale = location.pathname.split("/")[1];

export const allowedLocaleList = [
    "ko",
    "en"
];
Object.freeze(allowedLocaleList);

if(!allowedLocaleList.includes(locale)) {
    locale = "ko";
}

/**
 * 로케일 텍스트 관리 Class
 */
export class LocaleManager {
    /**
     * new LocaleManager([locale, locale], locale)
     * @param {Array<string>} allowedLocales 허용하는 로케일 종류
     * @param {string} locale 현재 로케일
     */
    constructor(allowedLocales, locale) {
        this.allowed = allowedLocales;
        this.locale = locale;
        this.storage = {};
        for(const locale of allowedLocales) {
            this.storage[locale] = {};
        }
    }

    /**
     * assign({key: {lang: content, lang: content}, ...})
     * @param {Object} data
     */
    assign(data) {
        for(const key in data) {
            const item = data[key][this.locale];
            if(nullish(item)) {
                return false;
            }
            this.storage[key] = item;
        }
        return this;
    }

    /**
     * assign한 값의 "$VALUE$" 텍스트를 template으로 대체합니다.
     * get(key, template, template, ...)
     * @param {string} key
     * @param {string} templates
     * @returns {string}
     */
    get(key, ...templates) {
        let value = this.storage[key];
        for(const template of templates) {
            value = value.replace("$VALUE$", template);
        }
        return value;
    }
}

/**
 * Element.prototype.getClassModifier 생성
 */
export function initModifierClass() {
    /**
     * 기존 className에 인자를 modifier 형식으로 추가해 반환
     * @param {string} className
     * @return {string}
     */
    Element.prototype.getModifierClass = function(className) {
        const original = [...this.classList].find(x => x.indexOf("--") < 0);

        if(nullish(original)) {
            return className;
        }

        return `${original}--${className}`;
    }

    /**
     * modifier 클래스 추가/삭제
     * @param {string} className
     * @param {boolean} set
     * @return {boolean}
     */
    Element.prototype.setModifierClass = function(className, set) {
        const modifierClassName = this.getModifierClass(className);

        if(modifierClassName === className) {
            return false;
        }

        // 클래스 지정
        this.classList[set ? "add" : "remove"](modifierClassName);
        return true;
    }

    /**
     * modifier 클래스 토글
     * @param {string}className
     * @return {boolean}
     */
    Element.prototype.toggleModifierClass = function(className) {
        const modifierClassName = this.getModifierClass(className);

        if(modifierClassName === className) {
            return false;
        }

        return toggleClass(this, modifierClassName);
    }
}

/**
 * nullish 여부 확인
 * @param value
 * @return {boolean}
 */
export function nullish(value) {
    return typeof value === "undefined" || value === null;
}

/**
 * Element 생성을 위한 Object 형식
 */
export class Blueprint {
    /**
     * @param {string} tag
     * @param {Object} option
     * @param {Object<Blueprint>} children
     */
    constructor(tag, option = {}, children = {}) {
        this.data = null;
        this.element = null;
        this.children = {};

        this.allowedInsertionPosition = {
            pre: "afterbegin",
            post: "beforeend"
        };

        Object.freeze(this.allowedInsertionPosition);
        for(const key in children) {
            this.children[key] = children[key];
        }

        this.data = {
            tag: tag,
            content: "",
            ...option
        };
    }

    /**
     * 요소 생성
     * @return {Blueprint}
     */
    produce() {
        this.element = document.createElement(this.data.tag);

        while(this.element.attributes.length > 0) {
            this.element.removeAttribute(this.element.attributes[0].name);
        }

        if(!nullish(this.data.attribute)) {
            for(const name in this.data.attribute) {
                const value = this.data.attribute[name];
                this.element.setAttribute(name, value);
            }
        }

        if(!nullish(this.data.dataset)) {
            for(const name in this.data.dataset) {
                this.element.dataset[name] = this.data.dataset[name];
            }
        }

        if(!nullish(this.data.style)) {
            for(const name in this.data.style) {
                this.element.style[name] = this.data.style[name];
            }
        }

        const listener = this.data.listener;
        if(!nullish(listener)) {
            for(const eventType in listener) {
                let argument = listener[eventType];
                if(!Array.isArray(argument)) {
                    argument = [argument];
                }

                this.element.addEventListener(eventType, ...argument);
            }
        }

        if(typeof this.data.content === "string") {
            if(this.data.content.length > 0) {
                this.element.innerHTML = this.data.content;
            }
        }else {
            throw new TypeError("[Blueprint] value of option.content is invalid. option.content must be a String.");
        }

        const childrenKeys = Object.keys(this.children);
        if(childrenKeys.length > 0) {
            for(const key of childrenKeys) {
                this.element.appendChild(this.children[key].produce().getElement());
            }
        }

        const text = this.data.text;
        if(!nullish(text)) {
            if(text instanceof Object) {
                for(const position in text) {
                    const positionValue = this.allowedInsertionPosition[position];
                    if(nullish(positionValue)) {
                        continue;
                    }

                    const content = "" + text[position];
                    this.element.insertAdjacentText(positionValue, content);
                }
            }else {
                this.element.insertAdjacentText("beforeend", "" + text);
            }
        }

        return this;
    }

    /**
     * 내용 지정
     * @return {Blueprint}
     */
    setContent(value) {
        this.data.content = value;

        return this;
    }

    /**
     * 옵션 지정(스타일, dataset, 리스너, 속성)
     * @param {Object} option
     * @return {Blueprint}
     */
    setOption(option) {
        this.data = deepMerge(this.data, option);

        return this;
    }

    /**
     * 옵션 제거
     * @param {Object} option
     * @return {Blueprint}
     */
    removeOption(option) {
        for(const name in option) {
            delete this.data[name][option[name]];
        }

        return this;
    }

    /**
     * 자식 요소 추가
     * @param {Blueprint} children
     * @return {Blueprint}
     */
    addChildren(...children) {
        for(const child of children) {
            this.children.push(child);
        }

        return this;
    }

    /**
     * 자식 요소 제거
     * @param {string|number} keys
     * @return {Blueprint}
     */
    removeChildren(...keys) {
        for(const key of keys) {
            delete this.children[key];
        }

        return this;
    }

    /**
     * 요소 인스턴스
     * @return {HTMLElement}
     */
    getElement() {
        return this.element;
    }

    /**
     * 옵션 정보
     * @return {Object}
     */
    getInfo() {
        return {...this.data};
    }

    /**
     * 자식 정보
     * @return {Object<Blueprint>}
     */
    getChildrenInfo() {
        return {...this.children};
    }
}

/**
 * Object 깊은 값 병합
 * @param target
 * @param source
 * @return {*}
 */
export function deepMerge(target, source) {
    for (const key in source) {
        if (source[key] instanceof Object) {
            Object.assign(source[key], deepMerge(target[key], source[key]))
        }
    }

    Object.assign(target || {}, source);
    return target;
}

/**
 * Object 깊은 복사
 * @param target
 * @return {*[]|*}
 */
export function deepCopy(target) {
    if (nullish(target) || !(target instanceof Object)) {
        return target
    }

    const result = Array.isArray(target) ? [] : {};

    for (const key in target) {
        result[key] = deepCopy(target[key]);
    }

    return result;
}

/**
 * value가 range(min, max)에서 벗어나면 해당 방향의 최소/최대 value를 반환
 * @param value
 * @param min
 * @param max
 * @return {*}
 */
export function cutRange(value, min, max) {
    if(!nullish(min) && value < min) {
        return min;
    }
    if(!nullish(max) && value > max) {
        return max;
    }
    return value;
}

/**
 * value가 range(min, max)에서 벗어나면 반대쪽의 최소/최대 value를 반환
 * @param value
 * @param min
 * @param max
 * @return {*}
 */
export function cycleRange(value, min, max) {
    if(nullish(min) || nullish(max)) {
        return value;
    }
    if(value < min) {
        return max;
    }
    if(value > max) {
        return min;
    }
    return value;
}

/**
 * 숫자에 콤마 찍기
 * @param number
 * @return {string}
 */
export function numberComma(number) {
    return `${number}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Object 깊은 값 고정
 * @param object
 * @return {Readonly<*>}
 */
export function deepFreeze(object) {
    if(object !== null && ["Object", "Array"].includes(object.constructor.name)) {
        for(const key in object) {
            const item = object[key];
            deepFreeze(item);
        }
    }
    return Object.freeze(object);
}

/**
 * Object null value 체크
 * @param {Object}object
 * @return {boolean}
 */
export function checkObjectNullish(object) {
    return Object.values(object).some(nullish);
}
