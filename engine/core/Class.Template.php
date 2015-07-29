<?php
/*
* @ Version : 0.305
* @ Force update : 0
*/

class pikolor_template extends APP_Controller{
	public $vars = array();
	public $template;
	public $template_path;
	public $config = array();
	public $route ;
	
	function pikolor_template(){
		$this->template_path = APP_PATH .  "Views" . DS;
	}
	
	function set_var($key , $val = ""){
		if (is_array($key))
		{
			foreach($key as $k=>$v)
			{
				$this->vars[$k] = $v;
			}
		}	
		else
		{
			$this->vars[$key] = $val;
		}
	}
	
	function setPath($path)
	{
		$this->template_path = $path;
	}
	
	function renderTemplate($template)
	{
		foreach($this->vars as $key => $val)
		{
			global $$key;
			$$key = $val;
		}
		
		$path = $this->template_path . $template . ".php";
		if (file_exists($path))
		{
			require_once($path);
		}
		else
		{
			/** Error handling**/
			echo "No such templates" . $path;
		}
	}
	
	function __destruct()
	{
	
	}
}