# SillyTavern - Wizard

Shows a Wizard to guide the user step-by-step through a list of pages.

| | | |
|-|-|-|
|![](./README/wiz-01.jpg)|![](./README/wiz-02.jpg)|![](./README/wiz-03.jpg)|
|![](./README/wiz-04.jpg)|![](./README/wiz-05.jpg)|![](./README/wiz-06.jpg)|
|![](./README/wiz-07.jpg)|![](./README/wiz-08.jpg)|![](./README/wiz-09.jpg)|
|![](./README/wiz-10.jpg)|![](./README/wiz-11.jpg)| |


```stscript
/wizard title="Simple Wizard" {:
	/wiz-nav |
	/wiz-page title="Page 1" {:
		/wiz-page-text This is a simple Wizard. |
	:} |
	/wiz-page title="Page 2" {:
		/wiz-page-text This is a the second page. |
	:} |
:} |
```
