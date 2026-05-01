package com.example.recipe_api.Dish.Repositories;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.jpa.domain.Specification;

import com.example.recipe_api.Core.Enums.Flag;
import com.example.recipe_api.Dish.Dtos.DishFilterDto;
import com.example.recipe_api.Dish.Entities.Dish;

import jakarta.persistence.criteria.Predicate;

public class DishSpecs {
    public static Specification<Dish> withFilters(DishFilterDto filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.getSearch() != null && !filter.getSearch().isBlank()) {
                String searchPattern = "%" + filter.getSearch().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("name")), searchPattern));
            }
            if (filter.getCategories() != null && !filter.getCategories().isEmpty()) {
                predicates.add(root.get("category").in(filter.getCategories()));
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
