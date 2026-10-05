# Welcome to your Expo app 👋

## Configuração necessária para usar o app

- A API Node em `server` precisa estar publicada e `EXPO_PUBLIC_API_URL` deve apontar para sua URL pública com `/api`.
- Para enviar códigos de recuperação por WhatsApp real, configure no servidor `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TEMPLATE_NAME`, `WHATSAPP_TEMPLATE_LANGUAGE` e `WHATSAPP_GRAPH_API_VERSION`. O template da Meta precisa estar aprovado e conter um parâmetro no corpo para o código. Sem essas credenciais, o servidor em desenvolvimento só retorna um código de demonstração; em produção, o envio falha com uma mensagem de configuração.
- `EXPO_PUBLIC_SUPPORT_WHATSAPP` recebe o número internacional da equipe de atendimento, somente dígitos (por exemplo, `55` + DDD + número). Sem ele, a ajuda continua disponível pelas perguntas frequentes e informa que o canal ainda não foi configurado.
- A foto e os documentos usam o bucket `documentos` do Supabase. O bucket e as permissões de armazenamento precisam existir no projeto.

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
