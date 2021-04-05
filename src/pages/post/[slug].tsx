import { GetStaticPaths, GetStaticProps } from 'next';
import Header from '../../components/Header/index';

import format from 'date-fns/format';
import ptBR from 'date-fns/locale/pt-BR';

import Prismic from '@prismicio/client'

import Head from 'next/head';

import { FiUser, FiCalendar, FiClock } from 'react-icons/fi'

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const words = post?.data.content
  .reduce((acc, value) => {
    const { heading } = value;
    const body = RichText.asText(value.body);

    return acc.concat(heading, body);
  }, '')
  .split(' ');

  const readingTime = Math.ceil(words?.length / 200);

  const router = useRouter();

  if (router.isFallback) {
    return <h1>Carregando...</h1>
  }

  const formattedDate = format(
    new Date(post.first_publication_date), 
    'dd MMM yyyy', 
    {locale: ptBR}
  )

  return (
    <>
      <Head>
        <title>{post.data.title} | SpaceTraveling</title>
      </Head>

      <header className={commonStyles.container}>
        <Header />
      </header>

      <main>
        <div className={styles.imgContainer}>
          <img src={post.data.banner.url} alt="banner"/>
        </div>
        <div className={styles.postContainer}>
          <h1>{post.data.title}</h1>

          <div>
            <div>
              <FiCalendar />
              {formattedDate}
            </div>
            <div>
              <FiUser />
              {post.data.author}
            </div>
            <div>
              <FiClock />
              <span>{readingTime} min</span>
            </div>
          </div>

          {post.data.content.map(content => {
            return (
              <main key={content.heading}>
                <h2>{content.heading}</h2>
                <main
                  dangerouslySetInnerHTML={{
                     __html: RichText.asHtml(content.body)
                  }}
                />
              </main>
            )
          })}
        </div>
      </main>
    </>
  )
};

export const getStaticPaths: GetStaticPaths  = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.Predicates.at('document.type', 'post')
  ]);

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid
      }
    }
  })

  return {
    paths,
    fallback: true,
  }
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const { slug } = context.params;

  const response = await prismic.getByUID('post', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        }
      })
    }
  }

  return {
    props: {
      post,
    }
  }
};
