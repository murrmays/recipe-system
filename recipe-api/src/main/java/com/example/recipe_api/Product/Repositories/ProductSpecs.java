package com.example.recipe_api.Product.Repositories;

import java.util.ArrayList;
import java.util.List;
import jakarta.persistence.criteria.Predicate;

import org.springframework.data.jpa.domain.Specification;

import com.example.recipe_api.Core.Enums.Flag;
import com.example.recipe_api.Product.Dtos.ProductFilterDto;
import com.example.recipe_api.Product.Entities.Product;

public class ProductSpecs {

    public static Specification<Product> withFilters(ProductFilterDto filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.getSearch() != null && !filter.getSearch().isBlank()) {
                String searchPattern = "%" + filter.getSearch().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), searchPattern),
                        cb.like(cb.lower(root.get("ingredients")), searchPattern)
                ));
            }

            if (filter.getCategories() != null && !filter.getCategories().isEmpty()) {
                predicates.add(root.get("category").in(filter.getCategories()));
            }

            if (filter.getReadiness() != null && !filter.getReadiness().isEmpty()) {
                predicates.add(root.get("readiness").in(filter.getReadiness()));
            }

            if (filter.getFlags() != null && !filter.getFlags().isEmpty()) {
                for (Flag flag : filter.getFlags()) {
                    predicates.add(cb.isMember(flag, root.get("flags")));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
