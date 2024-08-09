# SillyTavern - Wizard

Shows a Wizard to guide the user step-by-step through a list of pages.

| | | |
|-|-|-|
|![](./README/wiz-20.jpg)|![](./README/wiz-21.jpg)|![](./README/wiz-22.jpg)|
|![](./README/wiz-23.jpg)|![](./README/wiz-24.jpg)|![](./README/wiz-25.jpg)|
|![](./README/wiz-26.jpg)|![](./README/wiz-27.jpg)|![](./README/wiz-28.jpg)|
|![](./README/wiz-29.jpg)|![](./README/wiz-30.jpg)| |


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
