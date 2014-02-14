<?php 
class page_excel_upload extends Page {
	
	public function get_required_rights() { return array(); }
	
	public function execute() {
		if (isset($_GET["button"])) {
			?>
			<table style='width:100%;height:100%'>
			<tr><td valign=middle align=center>
			<div class='button' onclick="window.frameElement.<?php echo $_GET["button"];?>();">
				Open File...
			</div>
			<div><img src='<?php echo theme::$icons_16["info"];?>' style='vertical-align:bottom'/> Supported Formats: Microsoft Excel, Open Office Calc, Gnome Gnumeric, and CSV.</div>
			</td></tr>
			</table>
			<?php 
			return;
		}
		if (isset($_GET["new"])) {
			echo "Please upload an Excel file";
			return;
		}
		if (isset($_GET["id"])) {
			$path = PNApplication::$instance->storage->get_data_path($_GET["id"]);
		} else if (!isset($_FILES["excel"]) || $_FILES["excel"]['error'] <> UPLOAD_ERR_OK) {
			PNApplication::error("Error uploading file (".(isset($_FILES["excel"]) ? PNApplication::$instance->storage->get_upload_error($_FILES["excel"]) : "no file received").").");
			return;
		} else
			$path = $_FILES["excel"]['tmp_name'];
		require_once("component/lib_php_excel/PHPExcel.php");
		set_time_limit(120);
		try {
			$reader = PHPExcel_IOFactory::createReaderForFile($path);
			if (get_class($reader) == "PHPExcel_Reader_HTML") throw new Exception();
			$excel = $reader->load($path);
			if (isset($_GET["id"])) {
				PNApplication::$instance->storage->remove_data($_GET["id"]);
			}
		} catch (Exception $e) {
			PNApplication::error("Invalid file format: ".$e->getMessage());
			return;
		}
		$this->add_javascript("/static/excel/excel.js");
		$this->add_javascript("/static/widgets/splitter_vertical/splitter_vertical.js");
		$this->onload("setTimeout(init_page,1);");
		?>
		<div id='excel_container' style='width:100%;height:100%'>
		</div>
		<script type='text/javascript'>
		window.excel_uploaded = true;
		</script>
		<?php 
		$code = "";
		foreach ($excel->getWorksheetIterator() as $sheet) {
			$cols = 0;
			while ($sheet->cellExistsByColumnAndRow($cols, 1)) $cols++;
			$rows = 0;
			$nb_rows_without_cells = 0;
			foreach ($sheet->getRowIterator() as $row) {
				$rows++;
				$it = $row->getCellIterator();
				$it->setIterateOnlyExistingCells(false);
				$c = 0;
				$has_cells = false;
				foreach ($it as $col) {
					$c++;
					if ($sheet->cellExistsByColumnAndRow($col->getColumn(), $col->getRow()) && $col->getValue() <> null)
						$has_cells = true;
				}
				if ($c > $cols) $cols = $c;
				if (!$has_cells)
					$nb_rows_without_cells++;
				else
					$nb_rows_without_cells = 0;
			}
			$rows -= $nb_rows_without_cells;
			$code .= "xl.addSheet(".json_encode($sheet->getTitle()).",null,".$cols.",".$rows.",function(sheet){\n";
			for ($i = 0; $i < $cols; $i++) {
				$col = $sheet->getColumnDimensionByColumn($i);
				if ($col == null) $w = $sheet->getDefaultColumnDimension()->getWidth();
				else {
					$w = $col->getWidth();
					if (floor($w) == -1) $w = $sheet->getDefaultColumnDimension()->getWidth();
				}
				if (floor($w) == -1) $w = 5;
				$w *= 10;
				if ($w < 10) $w = 10;
				$code .= "\tsheet.getColumn(".$i.").setWidth(".floor($w+1).");\n";
			}
			for ($i = 0; $i < $rows; $i++) {
				$row = $sheet->getRowDimension($i+1);
				if ($row == null) $h = $sheet->getDefaultRowDimension()->getRowHeight();
				else {
					$h = $row->getRowHeight();
					if ($h == -1) $h = $sheet->getDefaultRowDimension()->getRowHeight();
				}
				if ($h == -1 || $h == 0) $h = 20;
				if ($h < 2) $h = 2;
				$code .= "\tsheet.getRow(".$i.").setHeight(".floor($h+1).");\n";
			}
			$code .= "\tvar c;";
			for ($col = 0; $col < $cols; $col++) {
				for ($row = 0; $row < $rows; $row++) {
					try {
						$cell = $sheet->getCellByColumnAndRow($col, $row+1);
						$val = $cell->getFormattedValue();
					} catch (Exception $e) {
						$val = "ERROR: ".$e->getMessage();
					}
					$code .= "\tc = sheet.getCell(".$col.",".$row.");";
					$code .= "c.setValue(".json_encode("".$val).");";
					$style = $sheet->getStyleByColumnAndRow($col, $row+1);
					$code .= "c.setStyle({";
					$code .= "overflow:'hidden'";
					if ($style <> null) {
						$font = $style->getFont();
						$font_name = $font <> null && $font->getName() <> null ? $font->getName() : "Calibri";
						$font_size = $font <> null && $font->getSize() <> null ? $font->getSize() : "11";
						$font_weight = $font <> null && $font->getBold() ? "bold" : "normal";
						$font_style = $font <> null && $font->getItalic() ? "italic" : "normal";
						$font_color = $font <> null && $font->getColor() <> null ? "#".$font->getColor()->getRGB() : "black";
						$code .= ",fontFamily:".json_encode($font_name);
						$code .= ",fontSize:".json_encode($font_size);
						$code .= ",fontWeight:".json_encode($font_weight);
						$code .= ",fontStyle:".json_encode($font_style);
						$code .= ",color:".json_encode($font_color);
						if ($style->getFill() <> null && $style->getFill()->getFillType() == PHPExcel_Style_Fill::FILL_SOLID && $style->getFill()->getStartColor() <> null)
							$code .= ",backgroundColor:'#".$style->getFill()->getStartColor()->getRGB()."'";
					}
					$code .= "});\n";
				}
			}
			$code .= "});\n";
		} 
		?>
		<script type='text/javascript'>
		function init_page() {
			window.excel = new Excel('excel_container', function(xl) {<?php echo $code; ?>});
		}							
		</script>
		<?php
	}
	
}
?>