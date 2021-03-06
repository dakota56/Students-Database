package org.pn.jsdoc;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.LinkedList;

import org.mozilla.javascript.CompilerEnvirons;
import org.mozilla.javascript.Parser;
import org.mozilla.javascript.ast.AstRoot;
import org.pn.jsdoc.model.Container;
import org.pn.jsdoc.model.Global;

public class JavaScriptDocGenerator {

	public static void main(String[] args) {
		try {
	        Global global = new Global();
	        global.addBuiltins();
	        File www = new File(args[0]);
			File out = new File(args[1]);
			if (args.length > 2) {
				File f = new File(www, args[2]);
				//System.out.println("Parsing file "+f.getAbsolutePath());
				FileInputStream in = new FileInputStream(f);
				byte[] buf = new byte[100000];
				int nb = in.read(buf);
				in.close();
				String src = new String(buf,0,nb);
				
			    CompilerEnvirons environment = new CompilerEnvirons();
		        environment.setRecordingComments(true);
		        environment.setRecordingLocalJsDocComments(true);
				Parser p = new Parser(environment);
		        AstRoot script = p.parse(src, null, 0);
		        global.parse(args[2], script);
		        if (args.length > 3 && args[3].equals("-debug")) {
		        	while (global.evaluate(global, new LinkedList<Container>()));
		        	System.out.println(script.debugPrint());
		        	return;
		        }
			} else {
				File component = new File(www, "component");
				for (File comp : component.listFiles()) {
					if (!comp.isDirectory()) continue;
					if (comp.getName().startsWith("lib_")) continue; // skip external libraries
					File stati = new File(comp, "static");
					if (!stati.exists()) continue;
					browse(stati, global, comp.getName(), "component/"+comp.getName()+"/");
				}
			}
			while (global.evaluate(global, new LinkedList<Container>()));
			//System.out.println("Generating output");
			out.delete();
			out.createNewFile();
			FileOutputStream fout = new FileOutputStream(out);
			fout.write("var jsdoc = ".getBytes());
			fout.write(global.generate("  ").getBytes());
			fout.write(";".getBytes());
			fout.close();
			//System.out.println("Documentation generated.");
		} catch (Throwable e) {
			e.printStackTrace(System.out);
		}
	}
	
	private static void browse(File dir, Global global, String component_name, String path) throws IOException {
		for (File f : dir.listFiles()) {
			if (f.isDirectory()) {
				if (f.getName().startsWith("lib_")) continue; // skip external libraries
				browse(f, global, component_name, path+f.getName()+"/");
				continue;
			}
			String filename = f.getName();
			if (!filename.endsWith(".js")) continue;
			//System.out.println("Analyzing "+path+f.getName());
			FileInputStream in = new FileInputStream(f);
			byte[] buf = new byte[100000];
			int nb = in.read(buf);
			in.close();
			String src = new String(buf,0,nb);
			
			try {
			    CompilerEnvirons environment = new CompilerEnvirons();
		        environment.setRecordingComments(true);
		        environment.setRecordingLocalJsDocComments(true);
				Parser p = new Parser(environment);
		        AstRoot script = p.parse(src, null, 0);
		        global.parse(path+f.getName(), script);
			} catch (Throwable t) {
				System.out.println("Error parsing file "+f.getAbsolutePath());
				t.printStackTrace(System.out);
			}
		}
	}
	
}
