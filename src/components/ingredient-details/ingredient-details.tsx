import { Preloader, IngredientDetailsUI } from '@ui';
import { useParams } from 'react-router-dom';

import {
  selectIngredients,
  selectIngredientsError,
  selectIngredientsLoading,
} from '@services/selectors/ingredientsSelectors';
import { useSelector } from '@services/store';

export const IngredientDetails = (): React.JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const ingredients = useSelector(selectIngredients);
  const isLoading = useSelector(selectIngredientsLoading);
  const error = useSelector(selectIngredientsError);
  const ingredientData = ingredients.find((ingredient) => ingredient._id === id);

  if (isLoading) {
    return <Preloader />;
  }

  if (error) {
    return <p role="alert">Не удалось загрузить ингредиенты: {error}</p>;
  }

  if (!ingredientData) return <p>Ингредиент не найден</p>;

  return <IngredientDetailsUI ingredientData={ingredientData} />;
};
