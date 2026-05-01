package com.example.recipe_api.Product.Services;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.web.multipart.MultipartFile;

import com.example.recipe_api.Core.Helpers.ProductMapper;
import com.example.recipe_api.Core.Services.FileStorageService;
import com.example.recipe_api.Product.Dtos.ProductFilterDto;
import com.example.recipe_api.Product.Dtos.ProductReadDto;
import com.example.recipe_api.Product.Dtos.ProductRequestDto;
import com.example.recipe_api.Product.Entities.Product;
import com.example.recipe_api.Product.Repositories.ProductRepository;
import com.example.recipe_api.Product.Repositories.ProductSpecs;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Sort;

@Service
public class ProductService {
    private final ProductRepository productRepository;
    private final ProductMapper productMapper;
    private final FileStorageService fileStorageService;

    public ProductService(ProductRepository productRepository, ProductMapper productMapper, FileStorageService fileStorageService){
        this.productRepository = productRepository;
        this.productMapper = productMapper;
        this.fileStorageService = fileStorageService;
    }

    @Transactional
    public ProductReadDto createProduct(ProductRequestDto dto, MultipartFile[] files) {
        Product product = productMapper.toEntity(dto);
        
        List<String> photos = processPhotos(dto.getPhotos(), files);
        product.setPhotos(photos);
        product.setCreationDate(LocalDateTime.now());

        Product savedProduct = productRepository.save(product);
        return productMapper.toReadDto(savedProduct);
    }

    @Transactional(readOnly = true)
    public List<ProductReadDto> getFilteredProducts(ProductFilterDto filter) {
        Sort sortOrder = parseSortOrder(filter.getSort());
        List<Product> products = productRepository.findAll(ProductSpecs.withFilters(filter), sortOrder);
        
        return products.stream()
                .map(productMapper::toReadDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProductReadDto getProductById(String id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Продукт не найден"));
        return productMapper.toReadDto(product);
    }

    @Transactional
    public ProductReadDto updateProduct(String id, ProductRequestDto dto, MultipartFile[] files) {
        Product existingProduct = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Продукт не найден"));

        productMapper.updateEntityFromDto(dto, existingProduct);
        List<String> photos = processPhotos(dto.getPhotos(), files);
        existingProduct.setPhotos(photos);
        existingProduct.setEditDate(LocalDateTime.now());
        Product updatedProduct = productRepository.save(existingProduct);
        return productMapper.toReadDto(updatedProduct);
    }

    @Transactional
    public void deleteProduct(String id) {
        productRepository.deleteById(id);
    }

    private List<String> processPhotos(List<String> existingPhotos, MultipartFile[] newFiles) {
        List<String> finalPhotos = new ArrayList<>();
        
        if (existingPhotos != null) {
            finalPhotos.addAll(existingPhotos);
        }
        if (newFiles != null) {
            for (MultipartFile file : newFiles) {
                if (!file.isEmpty()) {
                    finalPhotos.add(fileStorageService.storeFile(file));
                }
            }
        }
        if (finalPhotos.size() > 5) {
            throw new IllegalArgumentException("Максимальное количество фотографий - 5");
        }
        return finalPhotos;
    }

    private Sort parseSortOrder(String sortKey) {
        if (sortKey == null || sortKey.isBlank()) {
            return Sort.unsorted();
        }

        return switch (sortKey) {
            case "nameAsc" -> Sort.by("name").ascending();
            case "nameDesc" -> Sort.by("name").descending();
            
            case "caloriesAsc" -> Sort.by("calories").ascending();
            case "caloriesDesc" -> Sort.by("calories").descending();
            
            case "proteinsAsc" -> Sort.by("proteins").ascending();
            case "proteinsDesc" -> Sort.by("proteins").descending();
            
            case "fatsAsc" -> Sort.by("fats").ascending();
            case "fatsDesc" -> Sort.by("fats").descending();
            
            case "carbsAsc" -> Sort.by("carbs").ascending();
            case "carbsDesc" -> Sort.by("carbs").descending();
            
            default -> Sort.unsorted();
        };
    }
}
