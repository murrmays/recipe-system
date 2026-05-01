package com.example.recipe_api.Product.Controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Encoding;
import io.swagger.v3.oas.annotations.parameters.RequestBody;

import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;

import com.example.recipe_api.Product.Dtos.ProductFilterDto;
import com.example.recipe_api.Product.Dtos.ProductReadDto;
import com.example.recipe_api.Product.Dtos.ProductRequestDto;
import com.example.recipe_api.Product.Services.ProductService;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public ResponseEntity<List<ProductReadDto>> getFilteredProducts(@ParameterObject ProductFilterDto filter) {
        return ResponseEntity.ok(productService.getFilteredProducts(filter));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductReadDto> getProduct(@PathVariable String id) {
        try {
            return ResponseEntity.ok(productService.getProductById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @RequestBody(content = @Content(
        encoding = @Encoding(name = "dto", contentType = "application/json")
    ))
    public ResponseEntity<ProductReadDto> createProduct(
        @RequestPart("dto") ProductRequestDto dto, 
        @RequestPart(value = "files", required = false)
        MultipartFile[] files) 
    {
        try {
            return ResponseEntity.ok(productService.createProduct(dto, files));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @RequestBody(content = @Content(
        encoding = @Encoding(name = "dto", contentType = "application/json")
    ))
    public ResponseEntity<ProductReadDto> updateProduct(
            @PathVariable String id,
            @RequestPart("dto") ProductRequestDto dto,
            @RequestPart(value = "files", required = false) MultipartFile[] files) 
        {
        
        try {
            return ResponseEntity.ok(productService.updateProduct(id, dto, files));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable String id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }
}