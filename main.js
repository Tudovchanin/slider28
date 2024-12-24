




class Slider {
	// Конструктор класса Slider, принимает объект mediaQueries
	constructor(mediaQueries) {
		this.mediaQueries = mediaQueries;  // Медиа-запросы для определения количества видимых слайдов
	}


	// Метод инициализации слайдера, принимает объект с параметрами
	initSlider({
		btnNext = null,
		btnPrev = null,
		containerSlider,
		slider, item,
		itemLength }) {
		this.flagDragDropMouse = false; // Флаг dragDrop для desktop
		this.flagDragDropTouch = false; // Флаг dragDrop для touch устройств
		this.flagSliderCount = false;  // Флаг для подсчета шагов слайдера
		this.flagSliderNumberStep = false; //Флаг отображения общего количества шагов и текущего шага
		

		this.windowWidth = document.documentElement.clientWidth;  // Ширина окна

		this.elemItem = item;  // Один элемент слайдера
		this.elemBtnNext = btnNext;  // Кнопка для перехода к следующему слайду
		this.elemBtnPrev = btnPrev;  // Кнопка для перехода к предыдущему слайду
		// this.elemContainerSlider = containerSlider;  // Контейнер слайдера
		this.elemSlider = slider;  // Сам слайдер
		this.elemTotalStep = null // элемент для отображения общего кол-ва шагов 
		this.elemStepSlide = null //// элемент для отображения текущего шага

		this.stepNumber = 1; // Текущий шаг
		this.position = 0;  // Начальная позиция слайдера
		this.sliderLength = itemLength;  // Количество элементов item слайдера
		this.visibleSlides = this.getVisibleSlidesMediaQueries(this.mediaQueries);  // Количество видимых слайдов
		this.distance = this.updateWidthItem();  // Ширина одного элемента слайдера
		this.totalSteps = null; // 

		this.onResize = this.handleResize.bind(this); // обработчик события resize
		this.onDOMLoaded = this.handleDOMLoaded.bind(this); // обработчик события DOMContentLoaded


		// Установка обработчика события, когда документ полностью загружен
		document.addEventListener('DOMContentLoaded', this.onDOMLoaded);

		// Обработчик события изменения размера окна
		window.addEventListener('resize', this.onResize);


		// Установка обработчиков событий для кнопок вперед / назад
		if (this.elemBtnNext && this.elemBtnPrev) {

			this.onclickNext = this.handleClickNext.bind(this);
			this.onclickPrev = this.handleClickPrev.bind(this);


			this.elemBtnNext.addEventListener('click', this.onclickNext);
			this.elemBtnPrev.addEventListener('click', this.onclickPrev);
		}
	}



	dispatchSlideChangeEvent() {
    // Создаем новое пользовательское событие 'slideChanged'
    const event = new CustomEvent('slideChanged', {
        // Передаем дополнительные данные в свойстве detail
        detail: {
            currentStep: this.stepNumber, // Текущий шаг слайдера
            totalSteps: this.totalSteps,   // Общее количество шагов в слайдере
        },
    });

    // Отправляем (диспатчим) событие на элемент слайдера
    this.elemSlider.dispatchEvent(event); // Отправка события
}



	// Метод инициализации подсчета шагов
	initCount($totalStep = null, $stepSlide = null) {

		this.flagSliderCount = true;  //  включение флага подсчета шагов

		if (!$totalStep || !$stepSlide) return;

		this.elemTotalStep = $totalStep;  // Элемент для отображения общего количества шагов
		this.elemStepSlide = $stepSlide;  // Элемент для отображения текущего шага
		this.elemStepSlide.textContent = this.stepNumber;
		this.flagSliderNumberStep = true;
	}

	initStepCallback(callBack) {
		this.callBack = callBack;
	}


	// Удаление событий
	removeAllListener() {

		document.removeEventListener('DOMContentLoaded', this.onDOMLoaded);
		window.removeEventListener('resize', this.onResize);

		if (this.elemBtnNext && this.elemBtnPrev) {
			this.elemBtnNext.removeEventListener('click', this.onclickNext);
			this.elemBtnPrev.removeEventListener('click', this.onclickPrev);
		}

		if (this.flagDragDropMouse) {

			// Обработчики событий для мыши
			this.elemSlider.removeEventListener('mousedown', this.onmousedown, { passive: false });

			this.elemSlider.removeEventListener('mousemove', this.onmousemove, { passive: false });

			document.removeEventListener('mouseup', this.onmouseup);
		}

		if (this.flagDragDropTouch) {

			this.elemSlider.removeEventListener('touchstart', this.ontouchstart, { passive: false });
			this.elemSlider.removeEventListener('touchmove', this.ontouchmove, { passive: false });
			document.removeEventListener('touchend', this.ontouchend);

		}
	}

	handleClickNext() {
		this.moveNext();
		this.updateButtonStates();
		if (this.flagSliderCount) {
			this.showSlideStep();
			this.dispatchSlideChangeEvent(); 
		}
	}

	handleClickPrev() {
		this.movePrev();
		this.updateButtonStates();

		if (this.flagSliderCount) {
			this.showSlideStep();
			this.dispatchSlideChangeEvent(); 
		}
	}

	handleResize() {
		let newWindowWidth = document.documentElement.clientWidth;
		if (newWindowWidth === this.windowWidth) return;
		this.resetSlider();
		this.distance = this.updateWidthItem();
		this.visibleSlides = this.getVisibleSlidesMediaQueries(this.mediaQueries);

		if (this.flagSliderCount) {
			this.setCountTotalStep();  // Установка общего количества шагов
			if (!this.flagSliderNumberStep) return;
			this.showTotalStep();  // Отображение общего количества шагов
		}
		this.windowWidth = newWindowWidth;
		this.updateButtonStates();
	}

	handleDOMLoaded() {
		// this.elemSlider.style.transition = 'transform .3s linear';  // Установка анимации перехода
		if (this.flagSliderCount) {
			this.setCountTotalStep();  // Установка общего количества шагов
			if (!this.flagSliderNumberStep) return;
			this.showTotalStep();  // Отображение общего количества шагов
		}
		this.updateButtonStates();
	}

	initDragDrop(desktop = false) {
		this.flagDragDropTouch = true;
		this.isDragging = false;  // Флаг перетаскивания
		this.touchStart = 0;  // Начальная точка касания/клика
		this.touchEnd = 0;  // Конечная точка касания/клика
		this.touchMove = 0;  // Текущая позиция перетаскивания
		this.ontouchstart = this.handleStart.bind(this);
		this.ontouchmove = this.handleMove.bind(this);
		this.ontouchend = this.handleEnd.bind(this);

		// Обработчик события начала касания
		this.elemSlider.addEventListener('touchstart', this.ontouchstart, { passive: false });

		// Обработчик события перемещения касания
		this.elemSlider.addEventListener('touchmove', this.ontouchmove, { passive: false });

		// Обработчик события завершения касания
		document.addEventListener('touchend', this.ontouchend);

		if (!desktop) return;
		this.flagDragDropMouse = true;

		this.onmousedown = this.handleStart.bind(this);
		this.onmousemove = this.handleMove.bind(this);
		this.onmouseup = this.handleEnd.bind(this);

		// Обработчики событий для мыши
		this.elemSlider.addEventListener('mousedown', this.onmousedown, { passive: false });

		this.elemSlider.addEventListener('mousemove', this.onmousemove, { passive: false });

		document.addEventListener('mouseup', this.onmouseup);
	}

	handleStart(e) {
		e.preventDefault();
		const clientX = e.touches ? e.touches[0].clientX : e.clientX;

		this.startDragDrop(clientX);
		
	}

	handleMove(e) {
		if (!this.isDragging) return;
		// e.preventDefault();
		const clientX = e.touches ? e.touches[0].clientX : e.clientX;
		this.moveDragDrop(clientX);
	}

	handleEnd(e) {
		if (!this.isDragging) return;
		// e.preventDefault();
		this.endDragDrop();
		
	}

	// Метод начала перетаскивания
	startDragDrop(value) {
		this.isDragging = true;
		this.touchStart = value;
	}

	// Метод перемещения при перетаскивании
	moveDragDrop(value) {
		this.touchMove = value - this.touchStart + this.position;
		this.animateSlider(this.elemSlider, this.touchMove);
		this.touchEnd = value;
	}

	// Метод завершения перетаскивания
	endDragDrop() {
		this.isDragging = false;
		this.position = this.touchMove;

		setTimeout(() => {
			// Если позиция больше 0, вернуться к началу
			if (this.position > 0) {
				this.animateSlider(this.elemSlider, 0);
				this.position = 0;
				if (this.flagSliderCount) {
					this.showSlideStep();
				}
				// Если позиция меньше конца слайдера, вернуться к концу
			} else if (this.position < this.sliderEnd()) {
				this.animateSlider(this.elemSlider, this.sliderEnd());
				this.position = this.sliderEnd();
				this.showSlideStep();
				// Если перетаскивание было значительным, перейти на следующий слайд
			} else if (this.touchEnd - this.touchStart < -20) {
				this.position = this.distance * (Math.floor(this.position / this.distance));
				if (this.flagSliderCount) {
					this.showSlideStep();
				}
				this.animateSlider(this.elemSlider, this.position);
				// Если перетаскивание было значительным, перейти на предыдущий слайд
			} else if (this.touchEnd - this.touchStart > 20) {
				this.position = this.distance * (Math.ceil(this.position / this.distance));
				if (this.flagSliderCount) {
					this.showSlideStep();
				}
				this.animateSlider(this.elemSlider, this.position);
				// Иначе, оставить на текущем слайде
			} else {
				this.position = this.distance * (Math.round(this.position / this.distance));
				this.animateSlider(this.elemSlider, this.position);
			}
			this.updateButtonStates();
			this.dispatchSlideChangeEvent(); 
		}, 100);
	}

	// Метод вычисления конца слайдера
	sliderEnd() {
		return -(this.sliderLength * this.distance - this.visibleSlides * this.distance);
	}

	//Метод проверки кнопок для отключения или включения
	updateButtonStates() {
		if (this.elemBtnNext) {
			this.elemBtnNext.disabled = this.position <= this.sliderEnd();
		}
		if (this.elemBtnPrev) {
			this.elemBtnPrev.disabled = this.position >= 0;
		}
	}
	// Метод установки общего количества шагов
	setCountTotalStep() {
		this.totalSteps = this.sliderLength - this.visibleSlides + 1;
		return this.totalSteps
	}

	// Метод отображения общего количества шагов
	showTotalStep() {
		if (!this.flagSliderNumberStep) return;
		this.elemTotalStep.textContent = this.totalSteps;
	}

	// Метод отображения текущего шага
	showSlideStep() {

		if (this.position > 0) return;

		const valueStep = Math.abs(this.position / this.distance) + 1;
		this.stepNumber = valueStep;

		if (!this.flagSliderNumberStep) return;
		this.callBack(valueStep)

		if (valueStep >= +this.elemTotalStep.textContent) {
			this.elemStepSlide.textContent = this.elemTotalStep.textContent;
			return;
		}

		this.elemStepSlide.textContent = valueStep;
	}

	// Метод получения количества видимых слайдов по медиа-запросам
	getVisibleSlidesMediaQueries(media) {
		for (let key in media) {
			if (media[key].matches) {
				return parseInt(key);
			}
		}
	}

	// Метод обновления ширины элемента
	updateWidthItem() {
		return this.elemItem.offsetWidth;
	}

	// Метод перехода к следующему слайду
	moveNext() {
		const valueEnd = this.visibleSlides * this.distance - this.distance * this.sliderLength;
		if (this.position <= valueEnd) return;
	
		this.position = this.position - this.distance;
		this.animateSlider(this.elemSlider, this.position);
	}

	// Метод перехода к предыдущему слайду
	movePrev() {
		
		if (this.position === 0) return;
	
		this.position = this.position + this.distance;
		this.animateSlider(this.elemSlider, this.position);
	}

	// Метод анимации слайдера
	animateSlider(elem, valueTranslate) {
		requestAnimationFrame(() => {
			elem.style.transform = `translateX(${valueTranslate}px)`;
		});
	}

	// Метод сброса слайдера
	resetSlider() {
		this.position = 0;
		if (this.flagSliderNumberStep) {
			this.elemStepSlide.textContent = 1;
		}

		this.animateSlider(this.elemSlider, this.position);
	}
}



// Объект медиа-запросов, в ключах прописываем сколько видно слайдов, в css устанавливаем какое количество слайдов видно .item {
// 	flex-shrink: 0;
// 	flex-grow: 0;
// 	width: 25%; (25% это 4 слайда , 50% = 2 , 33% = 3, и тд)
// 	padding: 0 14px;
// } для правильной работы счетчика шагов нужно прописать ключ для каждого изменения кол-ва слайдов и указать разрешение при котором кол-во видимых слайдов меняется(медиа запросы в css)
const media = {
	1: window.matchMedia('(max-width: 500px)'),
	2: window.matchMedia('(max-width: 767px)'),
	3: window.matchMedia('(max-width: 1024px)'),
	5: window.matchMedia('(min-width: 1025px)'),
};

// Элементы для отображения общего количества шагов и текущего шага
const totalStep = document.querySelectorAll('.total-steps');
const stepSlide = document.querySelectorAll('.step-slide');




document.querySelectorAll('.container-slider').forEach((elem, index) => {
	// Объект с элементами слайдера, если кнопки ненужны не указываем их в объекте
	const $sliderAllElem = {
		btnNext: document.querySelectorAll('.btn-next-slide')[index],
		btnPrev: document.querySelectorAll('.btn-prev-slide')[index], //КНОПКИ ЕСЛИ НЕ НУЖНЫ ТО ПРОСТО НЕ ПЕРЕДАЕМ
		// containerSlider: elem,
		slider: elem.querySelector('.slider'),
		itemLength: elem.querySelectorAll('.item').length,
		item: elem.querySelector('.item'),
	}
	const sliderObj = new Slider(media);
	sliderObj.initSlider($sliderAllElem);//инициализация слайдера


	sliderObj.initCount(totalStep[index], stepSlide[index]);//ИНИЦИАЛИЗАЦИЯ СЧЕТЧИКА.НУЖНО ВЫЗВАТЬ ДЛЯ ОТОБРАЖЕНИЯ ШАГОВ. ЕСЛИ ПЕРЕДАТЬ АРГУМЕНТЫ  totalStep stepSlide ТО БУДУТ ОТОБРАЖАТЬСЯ ШАГИ 1 ИЗ N. ЕСЛИ НУЖНЫ ТОЛЬКО ИКОНКИ ШАГОВ ТО НЕ ПЕРЕДАЕМ АРГУМЕНТЫ А ВЫЗЫВАЕМ ПРОСТО МЕТОД sliderObj.initCount() И ПОТОМ ИНИЦИАЛИЗИРУЕМ ИКОНКИ ШАГОВ С ПОМОЩЬЮ МЕТОДА // sliderObj.initIconCount(allIconsCount, 'radio-active'); - allIconsCount ВСЕ ИКОНКИ ШАГОВ, radio-active КЛАСС КОТОРЫЙ БУДЕТ МЕНЯТЬ СОСТОЯНИЕ ИКОНКИ КОГДА ОНА АКТИВНА НА ТЕКУЩЕМ ШАГЕ---НУЖНО РЕАЛИЗОВАТЬ АВТОМАТИЧЕСКИЙ ПОДСЧЕТ КОЛИЧЕСТВА ИКОНОК ПОКА ЧТО КОЛИЧЕСТВО ИКОНОК ДОЛЖНО БЫТЬ РАВНО КОЛИЧЕСТВУ СЛАЙДОВ ПРОПИСАННЫХ ВРУЧНУЮ В HTML



	// sliderObj.initIconCount(allIconsCount, 'radio-active');

	sliderObj.initDragDrop('desktop');//инициализация drag'n drop не обязательна, если для desktop ненужно, то вызываем метод без аргумента
sliderObj.initStepCallback(showStepIcon);

// Подписка на событие
sliderObj.elemSlider.addEventListener('slideChanged', (e) => {
	console.log(`Событие: текущий шаг ${e.detail.currentStep}, всего шагов ${e.detail.totalSteps}`);
});


})

// калбек для отслеживания шагов
function showStepIcon(step) {
	const iconsStep = document.querySelectorAll('.radio');
	iconsStep.forEach(el => el.classList.remove('radio-active'));
	iconsStep[step-1].classList.add('radio-active')
}