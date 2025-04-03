type MediaQueries = {
  [key: string]: MediaQueryList;
};

type SliderOptions = {
  btnNext: HTMLElement | null;
  btnPrev: HTMLElement | null;
  sliderTrack: HTMLElement;
  item: HTMLElement;
  itemLength: number;
};


export class Slider {


  private mediaQueries: MediaQueries;

  private flagDragDropMouse: boolean = false;
  private flagDragDropTouch: boolean = false;

  private windowWidth = document.documentElement.clientWidth;

  private elemSliderTrack!: HTMLElement;
  private elemItem!: HTMLElement;
  private elemBtnNext: HTMLButtonElement | null = null;
  private elemBtnPrev: HTMLButtonElement | null = null;

  public totalSteps!: number;
  public stepNumber!: number;
  public position!: number;
  public sliderLength!: number;
  public visibleSlides: number | undefined;
  public distance!: number;

  public onResize!: () => void;
  public onDOMLoaded!: () => void;
  public onclickNext!: () => void;
  public onclickPrev!: () => void;

  private callBackResize: () => void = () => {};

  private isDragging: boolean | null = null;
  private touchStart: number | null = null;

  private touchEnd: number | null = null;
  private touchMove: number | null = null;

  private ontouchstart!: (e: Event) => void;
  private ontouchmove!: (e: Event) => void;
  private ontouchend!: (e: Event) => void;

  private onmousedown!: (e: Event) => void;
  private onmousemove!: (e: Event) => void;
  private onmouseup!: (e: Event) => void;

  // Конструктор класса Slider, принимает объект mediaQueries
  constructor(mediaQueries: MediaQueries) {
    this.mediaQueries = mediaQueries; // Медиа-запросы для определения количества видимых слайдов
  }

  // Метод инициализации слайдера, принимает объект с параметрами
  initSlider({
    btnNext = null,
    btnPrev = null,
    sliderTrack,
    item,
    itemLength,
  }: SliderOptions) {
    this.elemItem = item; // Один элемент слайдера
    this.elemBtnNext = btnNext as HTMLButtonElement; // Кнопка для перехода к следующему слайду
    this.elemBtnPrev = btnPrev as HTMLButtonElement; // Кнопка для перехода к предыдущему слайду
    this.elemSliderTrack = sliderTrack; // Сам слайдер

    this.stepNumber = 1; // Текущий шаг
    this.position = 0; // Начальная позиция слайдера
    this.sliderLength = itemLength; // Количество элементов item слайдера
    this.visibleSlides = this.getVisibleSlidesMediaQueries(this.mediaQueries); // Количество видимых слайдов
    this.distance = this.updateWidthItem(); // Ширина одного элемента слайдера
    this.setTotalSteps();

    this.onResize = this.handleResize.bind(this); // обработчик события resize
    this.onDOMLoaded = this.handleDOMLoaded.bind(this); // обработчик события DOMContentLoaded

    // Установка обработчика события, когда документ полностью загружен
    document.addEventListener("DOMContentLoaded", this.onDOMLoaded);

    // Обработчик события изменения размера окна
    window.addEventListener("resize", this.onResize);

    // Установка обработчиков событий для кнопок вперед / назад
    if (this.elemBtnNext && this.elemBtnPrev) {
      this.onclickNext = this.handleClickNext.bind(this);
      this.onclickPrev = this.handleClickPrev.bind(this);

      this.elemBtnNext.addEventListener("click", this.onclickNext);
      this.elemBtnPrev.addEventListener("click", this.onclickPrev);
    }
  }


  dispatchSlideChangeEvent() {
    const event = new CustomEvent("slideChanged", {
      bubbles: true,
      detail: {
        currentStep: this.stepNumber,
        totalSteps: this.totalSteps,
      },
    });

    this.elemSliderTrack.dispatchEvent(event);
  }

  initResizeCallback(callback: () => void) {
    this.callBackResize = callback;
  }

  // Удаление событий
  removeAllListener() {
    document.removeEventListener("DOMContentLoaded", this.onDOMLoaded);
    window.removeEventListener("resize", this.onResize);

    if (this.elemBtnNext && this.elemBtnPrev) {
      this.elemBtnNext.removeEventListener("click", this.onclickNext);
      this.elemBtnPrev.removeEventListener("click", this.onclickPrev);
    }

    if (this.flagDragDropMouse) {
      // Обработчики событий для мыши
      this.elemSliderTrack.removeEventListener("mousedown", this.onmousedown);

      this.elemSliderTrack.removeEventListener("mousemove", this.onmousemove);

      document.removeEventListener("mouseup", this.onmouseup);
    }

    if (this.flagDragDropTouch) {
      this.elemSliderTrack.removeEventListener("touchstart", this.ontouchstart);
      this.elemSliderTrack.removeEventListener("touchmove", this.ontouchmove);
      document.removeEventListener("touchend", this.ontouchend);
    }
  }

  handleClickNext() {
    this.moveNext();
    this.updateButtonStates();
    this.setSlideStep();
  }

  handleClickPrev() {
    this.movePrev();
    this.updateButtonStates();
    this.setSlideStep();
  }

  handleResize() {
    
    let newWindowWidth = document.documentElement.clientWidth;
    if (newWindowWidth === this.windowWidth) return;
    this.resetSlider();
    this.distance = this.updateWidthItem();
    this.visibleSlides = this.getVisibleSlidesMediaQueries(this.mediaQueries);
    this.updateButtonStates();
    this.setTotalSteps();
    this.windowWidth = newWindowWidth;
    this.dispatchSlideChangeEvent();

    this.callBackResize();
  }

  handleDOMLoaded() {
    this.updateButtonStates();
    this.setTotalSteps();
    this.dispatchSlideChangeEvent();
  }

  initDragDrop(desktop: boolean = false) {
    this.flagDragDropTouch = true;
    this.isDragging = false; // Флаг перетаскивания
    this.touchStart = 0; // Начальная точка касания/клика
    this.touchEnd = 0; // Конечная точка касания/клика
    this.touchMove = 0; // Текущая позиция перетаскивания
    this.ontouchstart = this.handleStart.bind(this);
    this.ontouchmove = this.handleMove.bind(this);
    this.ontouchend = this.handleEnd.bind(this);

    // Обработчик события начала касания
    this.elemSliderTrack.addEventListener("touchstart", this.ontouchstart, {
      passive: false,
    });

    // Обработчик события перемещения касания
    this.elemSliderTrack.addEventListener("touchmove", this.ontouchmove, {
      passive: false,
    });

    // Обработчик события завершения касания
    document.addEventListener("touchend", this.ontouchend);

    if (!desktop) return;
    this.flagDragDropMouse = true;

    this.onmousedown = this.handleStart.bind(this);
    this.onmousemove = this.handleMove.bind(this);
    this.onmouseup = this.handleEnd.bind(this);

    // Обработчики событий для мыши
    this.elemSliderTrack.addEventListener("mousedown", this.onmousedown, {
      passive: false,
    });

    this.elemSliderTrack.addEventListener("mousemove", this.onmousemove, {
      passive: false,
    });

    document.addEventListener("mouseup", this.onmouseup);
  }

  handleStart(e: any) {
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;

    this.startDragDrop(clientX);
  }

  handleMove(e: any) {
    if (!this.isDragging) return;
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    this.moveDragDrop(clientX);
  }

  handleEnd() {
    if (!this.isDragging) return;
    // e.preventDefault();
    this.endDragDrop();
  }

  // Метод начала перетаскивания
  startDragDrop(value: number) {
    this.isDragging = true;
    this.touchStart = value;
  }

  // Метод перемещения при перетаскивании
  moveDragDrop(value: number) {
    if (!this.touchStart) return;
    this.touchMove = value - this.touchStart + this.position;
    this.animateSlider(this.elemSliderTrack, this.touchMove);
    this.touchEnd = value;
  }

  // Метод завершения перетаскивания
  endDragDrop() {
    this.isDragging = false;
    if (!this.touchMove) return;
    this.position = this.touchMove;

    setTimeout(() => {
      if (!this.touchEnd || !this.touchStart) return;

      // Если позиция больше 0, вернуться к началу
      if (this.position > 0) {
        this.animateSlider(this.elemSliderTrack, 0);
        this.position = 0;

        this.setSlideStep();

        // Если позиция меньше конца слайдера, вернуться к концу
      } else if (this.position < (this.sliderEnd() || 0)) {
        this.animateSlider(this.elemSliderTrack, this.sliderEnd() || 0);
        this.position = this.sliderEnd() || 0;
        this.setSlideStep();
        // Если перетаскивание было значительным, перейти на следующий слайд
      } else if (this.touchEnd - this.touchStart < -20) {
        this.position =
          this.distance * Math.floor(this.position / this.distance);

        this.setSlideStep();
        this.animateSlider(this.elemSliderTrack, this.position);

        // Если перетаскивание было значительным, перейти на предыдущий слайд
      } else if (this.touchEnd - this.touchStart > 20) {
        this.position =
          this.distance * Math.ceil(this.position / this.distance);

        this.setSlideStep();
        this.animateSlider(this.elemSliderTrack, this.position);
        // Иначе, оставить на текущем слайде
      } else {
        this.position =
          this.distance * Math.round(this.position / this.distance);
        this.animateSlider(this.elemSliderTrack, this.position);
      }
      this.updateButtonStates();
   
    }, 100);
  }

  // Метод вычисления конца слайдера
  sliderEnd(): number | undefined {
    if (!this.visibleSlides) return;
    return -(
      this.sliderLength * this.distance -
      this.visibleSlides * this.distance
    );
  }

  // Метод установки общего количества шагов
  setTotalSteps() {
    if (!this.visibleSlides) return;
    this.totalSteps = this.sliderLength - this.visibleSlides + 1;
  }

  // Метод установки текущего шага
  setSlideStep() {
    if (this.position > 0) return;
    const valueStep = Math.abs(this.position / this.distance) + 1;
    this.stepNumber = valueStep;

    this.dispatchSlideChangeEvent();
  }

  // Метод получения количества видимых слайдов по медиа-запросам
  getVisibleSlidesMediaQueries(media: MediaQueries) {
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

  //Метод проверки кнопок для отключения или включения
  updateButtonStates() {
    if (this.elemBtnNext) {
      this.elemBtnNext.disabled = this.position <= (this.sliderEnd() || 0);
    }
    if (this.elemBtnPrev) {
      this.elemBtnPrev.disabled = this.position >= 0;
    }
  }

  // Метод перехода к следующему слайду
  moveNext() {
    if (!this.visibleSlides) return;
    const valueEnd =
      this.visibleSlides * this.distance - this.distance * this.sliderLength;
    if (this.position <= valueEnd) return;

    this.position = this.position - this.distance;
    this.animateSlider(this.elemSliderTrack, this.position);
  }

  // Метод перехода к предыдущему слайду
  movePrev() {
    if (this.position === 0) return;

    this.position = this.position + this.distance;
    this.animateSlider(this.elemSliderTrack, this.position);
  }

  // Метод анимации слайдера
  animateSlider(elem: HTMLElement, valueTranslate: number) {
    requestAnimationFrame(() => {
      elem.style.transform = `translateX(${valueTranslate}px)`;
    });
  }

  // Метод сброса слайдера
  resetSlider() {
    this.stepNumber = 1;
    this.position = 0;
    this.animateSlider(this.elemSliderTrack, this.position);
  }
}
