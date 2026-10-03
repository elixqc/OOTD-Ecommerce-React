import { Link } from 'react-router-dom';
import { Card, CardActionArea, CardContent, CardMedia, Chip, Rating, Typography } from '@mui/material';

export default function ProductCard({ product }) {
    const soldOut = product.totalStock === 0;

    return (
        <Card className="product-card">
            <CardActionArea component={Link} to={`/product/${product._id}`}>
                <CardMedia
                    component="img"
                    image={product.images[0]?.url}
                    alt={product.name}
                    className="product-card-image"
                />
                <CardContent>
                    <Typography variant="body2" color="text.secondary">
                        {product.brand || product.category}
                    </Typography>
                    <Typography variant="subtitle1" className="product-card-name">
                        {product.name}
                    </Typography>
                    <Typography variant="h6">₱{product.price.toLocaleString()}</Typography>
                    <Rating value={product.ratings} precision={0.5} size="small" readOnly />
                    {soldOut && <Chip label="Sold out" size="small" color="error" />}
                </CardContent>
            </CardActionArea>
        </Card>
    );
}