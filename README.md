
<h1>Projeto Sem-Fila v2.0</h1>

<p align = center> 
<a href = '#description'>Sobre</a> •
<a href = '#tecnologies'>Tecnologias e bibliotecas</a> •

</p>


<h2 id = 'description'> Sobre</h2>


Projeto Back da Startup SemFila que criei, um marketplace para casa de festas, bares e até restaurantes com proposito de eliminar filas.<br>

Ideia é simples, criar uma conta empresarial, aguardar aprovação do cnpj, cadastrar seus dados, webhook com stripe e adicionar seus produtos. <br>

O sistema já entregava tudo que o usuário precisava, métricas, QRCODES para ele disponibilizar como acesso aos clientes. <br>





<h3 > SemFila e suas aplicações </h3>

Os serviços incluiam:


<h2 id = 'description'> Microsservices</h2>

A primeira versão foi um monolito, o que era bem desagradavel considerando a quantidade de requests que lidava.<br>

Após 2 meses estudando sobre microsserviços finalmente consegui adequar toda estrutura e transformar de monolito para microsservices<br>

E com toda certeza, vale a pena, pois foi possivel descobrir melhorias localizadas no servidor<br>

<h2 id = 'description'> IO SOCKETS</h2>

Uma grande aliada nesse projeto, IO SOCKET é uma bibloteca capaz de integrar conexão ida e vinda de request<br>

Completamente necessário, ja que quando um cliente comprava algo por pix, o sistema precisava reconhecer quando ele pagar paga então enviar a ele via aplicação<br>

Graças ao front ser em PWA, havia o problema de enviar request's principalmente para um usuário nao cadastrado. Unica forma foi usar o IO SOCKET, assim previnindo perder LEADS<br>

Por que prevenir perder LEADS? Muitos usuários preferem obter o serviço evitando criar contas, todo aquele processo chato, aqui era possível.<br>

A aplicação rodava na digital ocean<br>




<h2 id = 'tecnologies'> Tecnologias e bibliotecas </h2>
<p>Linguagem de programação:<br>
<a href='https://nodejs.org/en'>Nodejs</a> <br>



 IDE:<br>

Para esse projeto, utilizei Visual Studio Code.<br>

<a href='https://code.visualstudio.com/'>Visual Studio Code</a>







