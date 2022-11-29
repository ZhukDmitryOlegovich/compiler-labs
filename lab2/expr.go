package main

import (
	"fmt"
	"go/ast"
	"go/format"
	"go/parser"
	"go/token"
	"os"
)

func mulTwo(node *ast.Expr) *ast.BinaryExpr {
	return &ast.BinaryExpr {
		X: *node,
		Op: token.MUL,
		Y: &ast.BasicLit {
			Kind: token.INT,
			Value: "2",
		},
	}
}

func insertMulTwoForMake(file *ast.File, fset *token.FileSet) {
	ast.Inspect(file, func(node ast.Node) bool {
		// fmt.Println("=")

		if callExpr, ok := node.(*ast.CallExpr); ok {
			fun := callExpr.Fun;
			if ident, ok := fun.(*ast.Ident); ok && ident.Name == "make" {
				// ast.Fprint(os.Stdout, fset, callExpr, nil)
				if len(callExpr.Args) == 2 {
					callExpr.Args = append(callExpr.Args, mulTwo(&callExpr.Args[1]));
				} else {
					callExpr.Args[2] = mulTwo(&callExpr.Args[2]);
				}
				// ast.Fprint(os.Stdout, fset, callExpr, nil)
			}
		}

		return true
	})
}

func main() {
	if len(os.Args) != 2 {
		return
	}

	fset := token.NewFileSet()
	if file, err := parser.ParseFile(fset, os.Args[1], nil, parser.ParseComments); err == nil {
		insertMulTwoForMake(file, fset)

		if format.Node(os.Stdout, fset, file) != nil {
			fmt.Printf("Formatter error: %v\n", err)
		}
		//ast.Fprint(os.Stdout, fset, file, nil)
	} else {
		fmt.Printf("Errors in %s\n", os.Args[1])
	}
}
