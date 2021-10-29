import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {

    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // TODO
      const responseStock = await api.get(`stock/${productId}`)
      const stock = responseStock.data as Stock
      
      const responseProd = await api.get(`products/${productId}`)
      var product = responseProd.data as Product;

      const cartContainer = cart.find(c => c.id === productId)
      if(!cartContainer) {

        if(product.amount === undefined) {product.amount = 0}

        if(stock.amount <= (product.amount + 1)) {
          throw new Error("Quantidade solicitada fora de estoque")
        }
        product.amount = 1

        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, product,]));

        setCart([...cart, product,])
        
      } else {
        var prodExist = cart.find(ct => ct.id === productId && stock.amount >= (ct.amount + 1))
       
        if(!prodExist) {
          toast.error('Quantidade solicitada fora de estoque');
          return
        }

        cart.forEach(c => {
          if(c.id === productId) {
            c.amount += 1
          }
        })

        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart]));
        setCart([...cart]) 
      }
     
    } catch {
      // TODO
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      const existProdCart = cart.find(c => c.id === productId)
      if(!existProdCart) {
        throw new Error('Erro na remoção do produto')
      }

      const newCart = cart.filter(function(item) {
        return item.id !== productId
      })
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      setCart(newCart)
    } catch {
      // TODO
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      
      if(amount <= 0 ) {
        return
      }

      const responseStock = await api.get(`stock/${productId}`)
      const prodStock = responseStock.data as Stock

      var prodHas = cart.find(ct => ct.id === productId && prodStock.amount >= amount)
      if(!prodHas) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      // TODO
      cart.forEach(c => {
        if(c.id === productId) {
          c.amount = amount
        }
      })

      localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart]));
      setCart([...cart]) 
    } catch {
      // TODO
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
