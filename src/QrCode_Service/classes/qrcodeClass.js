module.exports =
    class Qrcode {
        constructor(user_id, user_name, user_email,pedido_id,payment,company_id,store_id,qrcode_id,item,draw,cortesia,quantity,total) {
            this.user_id = user_id;
            this.user_name = user_name;
            this.user_email = user_email;
            this.pedido_id = pedido_id;
            this.payment = payment;
            this.company_id = company_id;
            this.store_id = store_id;
            this.qrcode_id = qrcode_id;
            this.item = item;
            this.draw = draw;
            this.cortesia = cortesia;
            this.quantity = quantity;
            this.total = total;
        }

        isQuantityLow(){ //Retorna verdadeiro ou falso
            return this.quantity <=0;
        }


    }